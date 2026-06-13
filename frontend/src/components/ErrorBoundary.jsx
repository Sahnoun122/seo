import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-gray-900">Something went wrong</h1>
              <p className="text-gray-500 text-sm">
                An unexpected error occurred. Please refresh the page or contact support if the problem persists.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary px-6 py-3"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
