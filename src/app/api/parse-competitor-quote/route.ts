import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { CompetitorParseResult } from "@/lib/types/comparison";

const SYSTEM_PROMPT = `You are a mortgage document parser. Extract structured data from this competitor mortgage quote document.

Return valid JSON matching this exact schema:
{
  "lenderName": "string - the lender/company name",
  "loanInfo": {
    "loanAmount": number,
    "propertyValue": number,
    "interestRate": number (as decimal, e.g. 0.065 for 6.5%),
    "loanTerm": number (years),
    "loanType": "string (e.g. Conventional, FHA, VA)"
  },
  "closingCosts": [
    { "label": "string - the fee name as shown on the document", "value": number, "category": "string" }
  ],
  "monthlyPayment": [
    { "label": "string - the payment component name", "value": number, "category": "monthly" }
  ],
  "totalClosingCosts": number,
  "totalMonthlyPayment": number
}

For closing cost categories use: "lender_fees", "title_fees", "prepaid", "government", "other".
For monthly payment items use category: "monthly".

Extract every line item fee you can find. Include origination fees, discount points, appraisal, credit report, title insurance, escrow fees, recording fees, transfer taxes, prepaid interest, homeowners insurance, property taxes, flood cert, etc.

For monthly payments include: principal & interest, property taxes, homeowners insurance, mortgage insurance, HOA dues, etc.

If a value cannot be determined, use 0.
If the lender name is not found, use "Unknown Lender".
Return ONLY the JSON object. No markdown fencing, no explanation, no extra text.`;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "application/pdf",
  "image/png": "image/png",
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const mediaType = ALLOWED_TYPES[file.type];
    if (!mediaType) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, PNG, or JPG file." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Convert to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // Build content block based on file type
    const isPdf = file.type === "application/pdf";
    const contentBlock = isPdf
      ? {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: "application/pdf" as const,
            data: base64Data,
          },
        }
      : {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: mediaType as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
            data: base64Data,
          },
        };

    // Call Anthropic API
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            contentBlock,
            {
              type: "text",
              text: "Parse this mortgage quote document and extract the structured data as JSON.",
            },
          ],
        },
      ],
    });

    // Extract text from response
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "AI returned no text response" },
        { status: 422 }
      );
    }

    // Parse JSON from response (handle potential markdown fencing)
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed: CompetitorParseResult;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON", raw: jsonStr },
        { status: 422 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("Competitor quote parse error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
