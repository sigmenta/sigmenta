// ─── Error Boundary ───────────────────────────────────────────────────────────
import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorId: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorId: '' };
  }

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Report to console only — never expose to users
    console.error('[ErrorBoundary] Unhandled render error:', {
      message: error.message,
      name: error.name,
      componentStack: info.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, errorId: '' });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center"
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
            <AlertTriangle size={30} className="text-red-500" strokeWidth={1.5} />
          </div>

          <h2 className="text-lg font-semibold text-[#292329] mb-1">
            একটি সমস্যা হয়েছে
          </h2>
          <p className="text-sm text-[#77717A] mb-1 max-w-xs">
            Something went wrong while loading this section.
          </p>
          <p className="text-xs text-[#77717A]/70 mb-6 font-mono">
            রেফারেন্স: {this.state.errorId}
          </p>

          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
              bg-[#D45D83] text-white text-sm font-medium
              hover:bg-[#B8446C] active:bg-[#A03860]
              transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D45D83]/50"
          >
            <RefreshCw size={15} />
            আবার চেষ্টা করুন
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
