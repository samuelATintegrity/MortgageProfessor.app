import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Zap, TrendingDown, FileText } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Mortgage Professor" className="h-8 w-auto" />
          </Link>
          <Link href="/login" className={buttonVariants({ variant: "outline" })}>
            Log In
          </Link>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 sm:py-28 lg:py-36 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Build Professional Mortgage Quotes in Seconds
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Stop screenshotting spreadsheets. Create beautiful, branded quotes
              your clients will love — from any device.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                Get Started
              </Link>
              <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Log In
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground">
              Everything you need to close faster
            </h2>
            <p className="mt-4 text-center text-muted-foreground text-lg max-w-2xl mx-auto">
              Purpose-built tools that make quoting effortless.
            </p>
            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-card-foreground">
                  Quick Quote Builder
                </h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  Compare 3 rate options side-by-side. Capture as image to text
                  clients instantly.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingDown className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-card-foreground">
                  Refinance Analysis
                </h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  Show clients exactly how much they&apos;ll save with a detailed
                  break-even analysis.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-card-foreground">
                  PDF Reports
                </h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  Generate professional, branded PDF quotes with full closing cost
                  itemization.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground">
              How it works
            </h2>
            <p className="mt-4 text-center text-muted-foreground text-lg">
              From rate sheet to client quote in under a minute.
            </p>
            <div className="mt-14 grid gap-10 sm:gap-12 lg:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  1
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  Enter your rates
                </h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  Input your daily rate sheet once. Set your standard fees.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  2
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  Build a quote
                </h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  Fill in loan details. See results instantly across 3 rate tiers.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  3
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  Share with clients
                </h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  Capture as image, export PDF, or save for later.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          &copy; 2026 Mortgage Professor. Built for loan officers.
        </div>
      </footer>
    </div>
  );
}
