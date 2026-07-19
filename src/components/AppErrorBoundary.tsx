import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class AppErrorBoundary extends Component<
  Props,
  State
> {
  state: State = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message,
    };
  }

  componentDidCatch(
    error: Error,
    errorInfo: ErrorInfo,
  ) {
    console.error(
      "Application rendering error:",
      error,
      errorInfo,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-semibold">
              AroundMe could not load
            </h1>

            <p className="mt-3 text-sm text-gray-600">
              Please refresh the page. If the problem continues,
              check the browser console.
            </p>

            <button
              type="button"
              className="mt-5 rounded-lg bg-black px-4 py-2 text-white"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
