export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white px-6 py-4">
      <div className="flex flex-col items-center justify-between gap-3 text-xs sm:flex-row">
        <div>
          <span className="font-semibold text-slate-600">© 2026 The State Farming Corporation of Kerala Ltd.</span>
          <span className="ml-2 text-slate-400">Government of Kerala Undertaking</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Documentation</span>
          <span aria-hidden="true">·</span>
          <span>Privacy Policy</span>
          <span aria-hidden="true">·</span>
          <span>System Health</span>
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">v1.0 · Demo</span>
        </div>
      </div>
    </footer>
  );
}
