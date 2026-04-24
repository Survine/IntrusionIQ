import Header from './components/Header';
import SignalRail from './components/SignalRail';
import WorkflowSteps from './components/WorkflowSteps';
import UploadPanel from './components/UploadPanel';
import ResultsPanel from './components/ResultsPanel';
import { useMetrics } from './hooks/useMetrics';
import { useUpload } from './hooks/useUpload';
import { NAV_ITEMS } from './constants';

export default function App() {
  const { metrics, apiStatus } = useMetrics();
  const { fileInputRef, isDragging, uploadState, error, results, handlers } = useUpload();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#05090d] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_15%_8%,rgba(163,230,53,0.09),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(59,130,246,0.09),transparent_20%),radial-gradient(circle_at_56%_82%,rgba(255,255,255,0.05),transparent_28%),linear-gradient(160deg,#05090d_0%,#091019_48%,#04070a_100%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:88px_88px] opacity-20 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.55),transparent_88%)]" />
      <div className="pointer-events-none fixed left-0 top-0 z-0 h-40 w-full bg-[linear-gradient(90deg,rgba(163,230,53,0.15),rgba(163,230,53,0.02)_55%,transparent)] opacity-70" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1520px] flex-col gap-6 p-4 md:p-6 xl:p-6">
        <header className="rounded-[24px] border border-white/10 bg-white/[0.035] px-6 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.26)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-[14px] border border-lime-400/20 bg-lime-400/10 text-xl text-lime-300">
                <ion-icon name="shield-checkmark" />
              </div>
              <div>
                <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-lime-300">IntrusionIQ</p>
                <h1 className="text-[0.98rem] font-semibold tracking-[-0.03em] text-zinc-50">Threat console for CSV network-flow analysis</h1>
              </div>
            </div>

            <nav className="flex flex-wrap gap-2" aria-label="Primary">
              {NAV_ITEMS.map(([label, href], index) => (
                <a
                  key={label}
                  href={href}
                  className={`rounded-full border px-3.5 py-2 text-sm font-medium transition duration-200 ${index === 0 ? 'border-lime-400/20 bg-lime-400/10 text-zinc-50' : 'border-white/10 bg-white/[0.025] text-zinc-400 hover:border-lime-400/20 hover:bg-lime-400/10 hover:text-zinc-50'}`}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </header>

        <main className="grid gap-6">
          <Header />

          <section id="workflow" className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
            <div className="grid gap-6">
              <WorkflowSteps />
              <UploadPanel
                fileInputRef={fileInputRef}
                isDragging={isDragging}
                uploadState={uploadState}
                error={error}
                {...handlers}
              />
            </div>

            <SignalRail metrics={metrics} apiStatus={apiStatus} />
          </section>

          <ResultsPanel results={results} />

          <footer className="px-1 pb-3 text-sm text-zinc-500">
            IntrusionIQ | local SOC dashboard for CSV-based network intrusion analysis.
          </footer>
        </main>
      </div>
    </div>
  );
}
