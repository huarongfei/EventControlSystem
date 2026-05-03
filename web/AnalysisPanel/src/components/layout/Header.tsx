import type { ConnectionStatus } from '@/types';
import ConnectionStatusIndicator from '@/components/common/ConnectionStatus';

interface Props {
  connectionStatus: ConnectionStatus;
}

export default function Header({ connectionStatus }: Props) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-panel-border bg-panel-surface/60 backdrop-blur-md px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white">ECS 赛况分析</h1>
      </div>
      <ConnectionStatusIndicator status={connectionStatus} />
    </header>
  );
}
