import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-8">
          <div className="bg-surface rounded-3xl border border-border-light shadow-lg p-xl max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-md">
              <span className="material-symbols-outlined text-error text-[36px]">error</span>
            </div>
            <h1 className="font-headline text-xl font-bold text-on-background mb-sm">
              เกิดข้อผิดพลาด
            </h1>
            <p className="text-text-muted font-body text-sm mb-lg">
              ระบบพบปัญหาที่ไม่คาดคิด กรุณาลองรีเฟรชหน้าจออีกครั้ง
            </p>
            {this.state.error && (
              <details className="text-left mb-lg">
                <summary className="text-xs text-text-muted cursor-pointer hover:text-primary transition-colors">
                  รายละเอียดข้อผิดพลาด (สำหรับนักพัฒนา)
                </summary>
                <pre className="mt-2 p-3 bg-surface-container-low rounded-xl text-xs text-error overflow-x-auto whitespace-pre-wrap break-words border border-border-light">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-primary px-8 py-2.5 text-sm font-bold text-on-primary shadow-sm hover:bg-[#7c008e] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] align-middle mr-1">refresh</span>
              รีเฟรชหน้าจอ
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
