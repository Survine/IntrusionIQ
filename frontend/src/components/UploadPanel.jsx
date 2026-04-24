export default function UploadPanel({
  fileInputRef,
  isDragging,
  uploadState,
  error,
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowseClick,
  onFileInput,
}) {
  return (
    <article id="analysis" className="rounded-[24px] border border-white/10 bg-white/[0.035] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.26)] backdrop-blur-xl">
      <div className="mb-5 flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-lime-300">Analysis input</p>
          <h3 className="text-[clamp(1.25rem,1.5vw,1.7rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-zinc-50">Drop a CSV or browse for a network flow export</h3>
        </div>
        <p className="max-w-lg text-sm leading-6 text-zinc-400">The file is checked for the required network-flow features before prediction begins.</p>
      </div>

      <div
        className={`grid min-h-[200px] cursor-pointer place-items-center gap-4 rounded-[22px] border border-dashed px-8 py-8 text-center transition duration-200 ${isDragging ? 'border-lime-400/45 bg-lime-400/8' : 'border-white/10 bg-white/[0.02] hover:border-lime-400/25 hover:bg-white/[0.04]'}`}
        onClick={onBrowseClick}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onBrowseClick();
          }
        }}
      >
        <div className="grid h-14 w-14 place-items-center rounded-[16px] border border-lime-400/20 bg-lime-400/10 text-[1.6rem] text-lime-300">
          <ion-icon name="cloud-upload-outline" />
        </div>
        <div>
          <p className="m-0 text-[1.02rem] font-semibold tracking-[-0.02em] text-zinc-50">Drag and drop your CSV here</p>
          <p className="mt-1 text-sm text-zinc-400">or click to browse local files</p>
        </div>
        <input ref={fileInputRef} className="hidden" id="file-input" name="file-input" type="file" accept=".csv" onChange={onFileInput} />
      </div>

      {uploadState.visible ? (
        <div className="mt-4 rounded-[18px] border border-white/10 bg-white/[0.025] p-4" aria-live="polite">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="m-0 text-sm text-zinc-100">{uploadState.text}</p>
            <span className="text-sm text-zinc-500">SOC upload queue</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-lime-400 to-cyan-400 transition-[width] duration-200" style={{ width: `${uploadState.progress}%` }} />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-[18px] border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">Supported input: CICIDS2017-style CSV with the 66 required flow features.</p>
      )}
    </article>
  );
}
