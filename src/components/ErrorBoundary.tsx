import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorScreen from './ErrorScreen';

interface Props {
  children: ReactNode;
  onExit?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App crashed with unhandled error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorScreen
          onExit={this.props.onExit || (() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = '/';
            }
          })}
          description="حدث خطأ غير متوقع في اللعبة. دعنا نعود إلى مكان مألوف."
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
