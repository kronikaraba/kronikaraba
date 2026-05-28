import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('React Error Boundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', padding: '24px',
          background: '#f9fafb', fontFamily: 'Inter, system-ui, sans-serif',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
            Bir hata oluştu
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', maxWidth: '400px' }}>
            Sayfa yüklenirken beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px', background: '#2563eb', color: '#fff',
              border: 'none', borderRadius: '8px', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer'
            }}
          >
            Sayfayı Yenile
          </button>
          {this.state.error && (
            <pre style={{
              marginTop: '24px', padding: '12px', background: '#fee2e2',
              borderRadius: '8px', fontSize: '11px', color: '#991b1b',
              maxWidth: '600px', overflow: 'auto', textAlign: 'left'
            }}>
              {String(this.state.error)}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)


