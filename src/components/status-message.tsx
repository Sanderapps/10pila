type StatusMessageProps = {
  title?: string;
  message?: string;
  variant?: "error" | "success" | "info" | "warning";
  fieldErrors?: Record<string, string>;
};

export function StatusMessage({
  title,
  message,
  variant = "info",
  fieldErrors
}: StatusMessageProps) {
  const entries = Object.entries(fieldErrors ?? {});

  if (!title && !message && entries.length === 0) {
    return null;
  }

  return (
    <div className={`status-box ${variant}`}>
      {title ? <p className="status-title">{title}</p> : null}
      {message ? <p>{message}</p> : null}
      {entries.length > 0 ? (
        <ul className="status-list">
          {entries.map(([field, text]) => (
            <li key={field}>{text}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
