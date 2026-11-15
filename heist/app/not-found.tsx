import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-5 py-20 text-center">
      <p className="headline text-7xl text-white/10">404</p>
      <h1 className="headline mt-2 text-3xl text-white">Nothing to rob here</h1>
      <p className="mt-3 max-w-md text-sm text-white/45">
        That record does not exist, or it was moved off the board.
      </p>
      <Link href="/" className="btn-pink mt-7">
        Back to the briefing
      </Link>
    </main>
  );
}
