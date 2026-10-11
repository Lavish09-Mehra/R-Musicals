import { useEffect } from 'react';
import { Link } from 'react-router-dom'; // optional – replace with <a href> if you don't use React Router

interface NotFoundPageProps {
  /** Optional custom home path (defaults to "/") */
  homePath?: string;
}

export function NotFoundPage({ homePath = '/' }: NotFoundPageProps) {
  useEffect(() => {
    document.title = '404 – Page Not Found';
  }, []);

  return (
    <div className="not-found-page">
      <div className="content">
        <span className="number" aria-hidden="true">404</span>

        <h1 className="title">Page not found</h1>
        <p className="description">
          The page you’re looking for doesn’t exist or has been moved.
          <br />
          Let’s get you back on track.
        </p>

        <div className="actions">
          <Link to={homePath} className="btn primary">
            Go back home
          </Link>
          <button
            type="button"
            className="btn secondary"
            onClick={() => window.history.back()}
          >
            Go back
          </button>
        </div>
      </div>

      <style>{`
        .not-found-page {
          --bg: #f4f5f7; --text: #18181b; --muted: #6b7280; --number: #d1d5db;
          --btn-bg: #18181b; --btn-text: #ffffff; --btn-hover: #3f3f46;
          --border: #d1d5db; --border-hover: #9ca3af; --focus: #2563eb;

          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          color: var(--text);
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 2rem;
        }

        @media (prefers-color-scheme: dark) {
          .not-found-page {
            --bg: #17181b; --text: #f4f4f5; --muted: #a1a1aa; --number: #3f3f46;
            --btn-bg: #f4f4f5; --btn-text: #18181b; --btn-hover: #d4d4d8;
            --border: #3f3f46; --border-hover: #71717a; --focus: #60a5fa;
          }
        }

        .content { text-align: center; max-width: 520px; }

        .number {
          display: block;
          margin-bottom: 2rem;
          user-select: none;
          font-size: clamp(6rem, 18vw, 9rem);
          font-weight: 800;
          letter-spacing: -0.05em;
          line-height: 1;
          color: var(--number);
        }

        .title {
          font-size: clamp(1.75rem, 5vw, 2.25rem);
          font-weight: 700;
          margin: 0 0 1rem;
          letter-spacing: -0.025em;
        }

        .description {
          font-size: 1.125rem;
          line-height: 1.6;
          color: var(--muted);
          margin: 0 0 2.5rem;
        }

        .actions {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.7rem 1.25rem;
          font-size: 0.95rem;
          font-weight: 600;
          font-family: inherit;
          border-radius: 6px;
          text-decoration: none;
          cursor: pointer;
          border: 1px solid transparent;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }
        .btn:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }

        .btn.primary { background: var(--btn-bg); color: var(--btn-text); }
        .btn.primary:hover { background: var(--btn-hover); }

        .btn.secondary { background: transparent; color: var(--text); border-color: var(--border); }
        .btn.secondary:hover { border-color: var(--border-hover); }

        @media (max-width: 480px) {
          .actions { flex-direction: column; width: 100%; }
          .btn { width: 100%; }
        }
      `}</style>
    </div>
  );
}