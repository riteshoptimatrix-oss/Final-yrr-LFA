"use client";

export default function LogicModuleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[#18181B]">Something went wrong</h1>
        <p className="text-sm text-[#52525B] leading-relaxed">
          The Logic Module encountered an unexpected error. Please try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #3B60E4, #1D4ED8)",
            boxShadow: "0 2px 10px rgba(29,78,216,0.3)",
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
