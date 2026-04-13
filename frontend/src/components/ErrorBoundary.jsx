import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error", error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#330000', color: 'white', minHeight: '100vh', zIndex: 100000 }}>
          <h1>💥 React Crash</h1>
          <p style={{ color: '#ffaaaa', fontSize: '1.2rem' }}>{this.state.error?.toString()}</p>
          <pre style={{ background: '#000', padding: '1rem', overflow: 'auto' }}>
            {this.state.info?.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
