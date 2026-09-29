import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorFallback } from './ErrorFallback'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    if (import.meta.env.DEV) {
      console.error('[Fin-Track] ErrorBoundary:', error, errorInfo)
    }
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  private handleHome = () => {
    window.location.href = '/'
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const { error, errorInfo } = this.state

    const stack = [
      error?.stack?.trim() || error?.message?.trim() || null,
      errorInfo?.componentStack?.trim() ? `\n--- Arborescence React ---\n${errorInfo.componentStack.trim()}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    return (
      <ErrorFallback
        title="Oups, un problème est survenu"
        message={error?.message || 'Une erreur inattendue est survenue.'}
        errorStack={stack || null}
        onReload={this.handleReload}
        onHome={this.handleHome}
      />
    )
  }
}
