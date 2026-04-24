export default function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-gray-400">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-[#0073B9] rounded-full animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
