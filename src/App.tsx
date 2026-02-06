import { useState, useEffect } from 'react';
import { ContributionGraph } from './components/ContributionGraph';

function App() {
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    // simple router
    const path = window.location.pathname;
    // We assume the app is hosted at root or a subpath defined in vite config base.
    // However, for dynamic determination without react-router:
    // We can check if there's a path segment after the known base.
    // For local dev, base is likely /.
    
    // Quick heuristic: take the last non-empty segment.
    const segments = path.split('/').filter(Boolean);
    
    // If we are at root, segments might be empty or just ['repo-name'] if on GH pages project site?
    // This is tricky without predictable routing.
    // Let's rely on a query param or hash fallback if the path fails?
    // No, user specifically requested baseurl/username.
    
    // Let's assume the username is the LAST segment if there are segments.
    // BUT if the user is at the homepage of the repo, e.g. /notion-github-graph/, 'notion-github-graph' is the last segment. This is bad.
    
    // Let's try to detect if the last segment looks like a username vs the repo name.
    // Actually, maybe we provide an input field on the home page.
    // And when the user types a username, we navigate to ./username.
    
    // FOR NOW: If we are in dev (localhost), any path is valid.
    // If in prod, we might need a specific check.
    
    // Let's go with: if param 'user' exists, use it. Else use path.
    const params = new URLSearchParams(window.location.search);
    if (params.get('user')) {
      setUsername(params.get('user')!);
      return;
    }
    
    // Path logic:
    // If segments > 0 and the last segment is NOT 'index.html'
    if (segments.length > 0) {
      const last = segments[segments.length - 1];
      // Exclude generic names if needed, but 'rakhul' is a valid username.
      // We will treat the last segment as username unless it is the repo name (which we might not know easily).
      // A safe bet: if user visits /notion-github-graph/rakhul, we get rakhul.
      // If user visits /notion-github-graph/, we might get notion-github-graph.
      
      // Let's just USE the last segment. If it happens to be the repo name, the graph will likely fail (User not found) and show error.
      // We can handle that error gracefully in the UI.
      if (last !== 'index.html') {
         setUsername(last);
      }
    }
  }, []);

  // Landing / Generator
  if (!username) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%', 
        textAlign: 'center',
        padding: '2rem'
      }}>
        <h1 style={{ fontWeight: 600, fontSize: '24px', marginBottom: '16px' }}>GitHub Contribution Graph</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Embed your GitHub graph in Notion with a clean, native look.
        </p>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const input = (e.currentTarget.elements.namedItem('username') as HTMLInputElement).value;
            if (input) {
               window.location.href = `${window.location.pathname === '/' ? '' : window.location.pathname}/${input}`.replace(/\/\//g, '/');
            }
          }}
          style={{ display: 'flex', gap: '8px' }}
        >
          <input 
            name="username" 
            placeholder="GitHub Username" 
            style={{ 
              padding: '8px 12px', 
              borderRadius: '6px', 
              border: '1px solid var(--color-level-0)',
              background: 'transparent',
              color: 'var(--text-color)',
              outline: 'none'
            }}
          />
          <button 
            type="submit"
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: 'var(--color-level-4)',
              color: 'white',
              border: 'none',
              fontWeight: 500
            }}
          >
            Generate
          </button>
        </form>
      </div>
    );
  }

  return <ContributionGraph username={username} />;
}

export default App;
