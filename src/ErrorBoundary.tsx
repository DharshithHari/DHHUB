import React from "react";

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children?: React.ReactNode;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // You can log error to an external service here
    // console.error(error, info);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: "system-ui, -apple-system, Roboto, Arial" }}>
          <h2 style={{ color: "#b91c1c" }}>Something went wrong</h2>
          <pre style={{ whiteSpace: "pre-wrap", background: "#111827", color: "#e5e7eb", padding: 12, borderRadius: 6 }}>
            {this.state.error.stack || String(this.state.error)}
          </pre>
          <button
            onClick={() => location.reload()}
            style={{ marginTop: 12, padding: "8px 12px", background: "#2563eb", color: "#fff", borderRadius: 6, border: "none" }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children as React.ReactElement | null;
  }
}
