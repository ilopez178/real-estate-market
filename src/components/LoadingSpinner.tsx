export default function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-[#6b7280]">
      <div className="w-5 h-5 border-2 border-[#2a2a2a] border-t-[#0ea5e9] rounded-full animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
