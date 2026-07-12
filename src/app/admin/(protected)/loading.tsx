export default function AdminLoading() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center" role="status" aria-live="polite">
      <div className="text-center text-sage-800">
        <span className="mx-auto block size-9 animate-spin rounded-full border-4 border-sage-200 border-r-sage-700" />
        <p className="mt-4 text-sm">Loading / 正在加载…</p>
      </div>
    </div>
  );
}
