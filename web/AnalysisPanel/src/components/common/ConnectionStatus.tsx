import type { ConnectionStatus as Status } from '@/types';

const statusConfig: Record<Status, { label: string; color: string; dotClass: string }> = {
  connected: { label: '已连接', color: 'text-emerald-400', dotClass: 'bg-emerald-400' },
  connecting: { label: '连接中…', color: 'text-yellow-400', dotClass: 'bg-yellow-400 animate-pulse' },
  disconnected: { label: '已断开', color: 'text-red-400', dotClass: 'bg-red-400' },
  reconnecting: { label: '重连中…', color: 'text-yellow-400', dotClass: 'bg-yellow-400 animate-pulse' },
};

interface Props {
  status: Status;
}

export default function ConnectionStatus({ status }: Props) {
  const cfg = statusConfig[status];
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`inline-block h-2 w-2 rounded-full ${cfg.dotClass}`} />
      <span className={cfg.color}>{cfg.label}</span>
    </div>
  );
}
