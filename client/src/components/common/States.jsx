export function LoadingSkeleton({ lines = 3 }) {
  return <div className="state-card" aria-label="Loading feedback" role="status">{Array.from({ length: lines }, (_, index) => <span className="skeleton-line" key={index} />)}</div>;
}
export function EmptyState({ title = 'No feedback found', message = 'Try a different search or filter.' }) {
  return <div className="state-card"><span className="state-symbol" aria-hidden="true">◇</span><h3>{title}</h3><p>{message}</p></div>;
}
export function ErrorMessage({ message = 'Something went wrong. Please try again.' }) {
  return <div className="error-message" role="alert">{message}</div>;
}
