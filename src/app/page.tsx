export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {/* Replace the Image component with a standard img tag */}
        <img
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={37}
        />
        
        <div className="flex flex-col items-center sm:items-start">
          <h1 className="text-[48px] leading-[60px] font-bold max-w-[840px] text-center sm:text-left">
            Architecture Timesheet System
          </h1>
          <p className="text-[18px] leading-[28px] text-gray-600 dark:text-gray-300 max-w-[660px] text-center sm:text-left">
            Track time on architecture projects by phase and submit for approval.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <a className="no-underline" href="/login">
            <button className="bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white rounded-lg text-sm font-medium px-4 py-2 text-center transition-colors hover:bg-gray-900 dark:hover:bg-gray-100">
              Sign In
            </button>
          </a>
        </div>
      </main>
    </div>
  );
}