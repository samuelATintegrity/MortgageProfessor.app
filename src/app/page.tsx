import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Mortgage Professor"
        className="h-14 w-auto mb-6"
      />
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        The Mortgage Professor
      </h1>
      <p className="mt-2 text-lg text-gray-500">For testing</p>
      <div className="mt-8">
        <Link href="/signup" className={buttonVariants({ size: "lg" }) + " rounded-full bg-black hover:bg-gray-800 text-white"}>
          Sign Up
        </Link>
      </div>
    </div>
  );
}
