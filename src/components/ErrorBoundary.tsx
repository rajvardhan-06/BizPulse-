import React, { type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// React 19 component base class compatibility
const BaseComponent = React.Component as unknown as {
  new (props: ErrorBoundaryProps): {
    props: ErrorBoundaryProps;
    state: ErrorBoundaryState;
    setState(state: Partial<ErrorBoundaryState> | ((prevState: ErrorBoundaryState) => Partial<ErrorBoundaryState>)): void;
    render(): ReactNode;
  };
};

export class ErrorBoundary extends BaseComponent {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC] dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              BizPulse encountered an unexpected rendering state. The application can automatically recover.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 bg-[#3562FF] hover:bg-[#2B54E6] text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
