export default function Header() {
  return (
    <section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.26)] backdrop-blur-xl">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)] lg:items-end">
        <div>
          <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-lime-300">How it works</p>
          <h2 className="max-w-[16ch] text-[clamp(2rem,2.3vw,3rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-zinc-50">
            Upload once, read the pipeline, understand the threat.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 md:text-base md:leading-7">
            IntrusionIQ keeps the flow simple: the CSV goes in, the model processes it, and the threat summary comes back in a layout that explains itself.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
            <span className="block text-[0.68rem] uppercase tracking-[0.18em] text-zinc-500">Input</span>
            <strong className="mt-2 block text-[0.98rem] text-zinc-50">CSV upload</strong>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
            <span className="block text-[0.68rem] uppercase tracking-[0.18em] text-zinc-500">Process</span>
            <strong className="mt-2 block text-[0.98rem] text-zinc-50">Two-stage ML</strong>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
            <span className="block text-[0.68rem] uppercase tracking-[0.18em] text-zinc-500">Output</span>
            <strong className="mt-2 block text-[0.98rem] text-zinc-50">Threat summary</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
