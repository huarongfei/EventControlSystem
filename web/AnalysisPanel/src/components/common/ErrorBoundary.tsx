import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** 自定义 fallback，默认使用内置错误 UI */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 全局错误边界 — 捕获子组件渲染崩溃，防止白屏
 *
 * 用法:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 开发环境下输出详细错误信息
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, errorInfo.componentStack);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-panel-bg p-8">
          <div className="mb-6 text-7xl">💥</div>
          <h1 className="mb-2 text-2xl font-bold text-white">页面渲染出错</h1>
          <p className="mb-6 max-w-md text-center text-sm text-slate-400">
            {this.state.error?.message || '发生了未预期的错误'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/80"
            >
              重试
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-panel-border px-6 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
