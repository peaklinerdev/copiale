// Reusable error banner that knows how to render the structured ApiError
// shape from copiale-p2p-api (M2 / M6). Surfaces:
//   - top-level message
//   - per-field validation issues (under each label or all collected)
//   - X-Request-Id as a small "ref:" line for support correlation
//
// Use issuesByField(err) at the call site if you want to render issues
// inline next to specific form fields instead of in this banner.

import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApiError, issuesByField } from '@/api/errors';

interface ErrorBannerProps {
  /** Either a string message (legacy) or an ApiError (preferred). */
  error: string | ApiError | null | undefined;
  /** When true, render Zod validation issues collected by field. */
  showIssues?: boolean;
  className?: string;
}

export function ErrorBanner({ error, showIssues = true, className }: ErrorBannerProps) {
  if (!error) return null;

  if (typeof error === 'string') {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const grouped = showIssues ? issuesByField(error) : {};
  const fieldEntries = Object.entries(grouped);

  return (
    <Alert variant="destructive" className={className}>
      <AlertDescription>
        <div className="space-y-2">
          <div>{error.message}</div>
          {fieldEntries.length > 0 && (
            <ul className="ml-4 list-disc text-sm">
              {fieldEntries.flatMap(([field, msgs]) =>
                msgs.map((msg, i) => (
                  <li key={`${field}-${i}`}>
                    <span className="font-medium">{field}</span>: {msg}
                  </li>
                )),
              )}
            </ul>
          )}
          {error.requestId && (
            <div className="text-xs opacity-70 mt-1">ref: {error.requestId}</div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
