type Props = {
  title: string;
  message: string;
};

export function AdminEmptyState({ title, message }: Props) {
  return (
    <div className="rounded-2xl border border-green-400/15 bg-green-400/5 p-6 text-center">
      <p className="text-xs font-black tracking-[4px] text-green-300">CLEAR</p>
      <h3 className="mt-3 text-2xl font-black text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{message}</p>
    </div>
  );
}
