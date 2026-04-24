export default function Sidebar({ apiStatus }) {
  return (
    <aside className="sticky top-6 h-fit rounded-[24px] border border-white/10 bg-zinc-950/90 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-[16px] border border-lime-400/20 bg-lime-400/10 text-2xl text-lime-300">
          <ion-icon name="shield-checkmark" />
        </div>
        <div>
          <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-lime-300">IntrusionIQ</p>
          <h1 className="text-[1rem] font-semibold tracking-[-0.03em] text-zinc-50">Threat Ledger</h1>
        </div>
      </div>

      <nav className="mt-8 grid gap-2" aria-label="Primary">
        {[
          ['Overview', 'grid', '#overview'],
          ['Analysis', 'scan', '#analysis'],
          ['Results', 'bar-chart', '#results'],
          ['Health', 'pulse', '#health'],
        ].map(([label, icon, href], index) => (
          <a
            key={label}
            className={`flex items-center gap-3 rounded-[14px] border px-4 py-3 text-sm font-medium transition duration-200 ${index === 0 ? 'border-lime-400/25 bg-lime-400/10 text-zinc-50' : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-lime-400/20 hover:bg-lime-400/10 hover:text-zinc-50'}`}
            href={href}
          >
            <ion-icon name={icon} className="text-lg" />
            <span>{label}</span>
          </a>
        ))}
      </nav>

      <section className="mt-8 border-t border-white/10 pt-5 text-sm leading-6 text-zinc-400">
        <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-zinc-500">System posture</p>
        <div className="mb-3 flex items-center gap-2 font-semibold text-zinc-100">
          <span className="h-2.5 w-2.5 rounded-full bg-lime-400 shadow-[0_0_0_6px_rgba(163,230,53,0.12)]" />
          <span>{apiStatus}</span>
        </div>
        <p>Two-stage inference for CSV bulk prediction with a clean analyst-facing presentation.</p>
      </section>
    </aside>
  );
}
