const steps = [
  {
    number: '01',
    title: 'Upload CSV',
    body: 'Drop a CICIDS2017-style flow export or browse for a local file.',
    icon: 'cloud-upload',
  },
  {
    number: '02',
    title: 'Run detection',
    body: 'The backend validates 66 features, then runs the two-stage ML pipeline.',
    icon: 'scan',
  },
  {
    number: '03',
    title: 'Review threats',
    body: 'See total flows, attack share, confidence, and the ranked attack families.',
    icon: 'analytics',
  },
];

export default function WorkflowSteps() {
  return (
    <section className="rounded-[24px] border border-white/10 bg-white/[0.035] px-6 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.26)] backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-lime-300">Workflow</p>
          <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-zinc-50">A short guided path</h3>
        </div>
        <span className="text-sm text-zinc-500">Start here</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {steps.map((step, index) => (
          <article key={step.number} className="relative">
            {index < steps.length - 1 ? <div className="absolute right-0 top-7 hidden h-px w-[calc(100%-4rem)] bg-white/10 lg:block" /> : null}
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 flex-none place-items-center rounded-[14px] border border-white/10 bg-white/[0.03] text-lime-300">
                <ion-icon name={step.icon} className="text-xl" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-zinc-500">{step.number}</span>
                  <h4 className="text-base font-semibold tracking-[-0.03em] text-zinc-50">{step.title}</h4>
                </div>
                <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">{step.body}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
