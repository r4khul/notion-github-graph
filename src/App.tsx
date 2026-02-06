import { useState, useEffect } from 'react';
import { ContributionGraph } from './components/ContributionGraph';

function App() {
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    // simple router
    const base = import.meta.env.BASE_URL;
    const path = window.location.pathname;
    
    // Remove base path from pathname to get the relative path
    const relativePath = path.startsWith(base) ? path.slice(base.length) : path;
    const segments = relativePath.split('/').filter(Boolean);
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('user')) {
      setUsername(params.get('user')!);
      return;
    }
    
    if (segments.length > 0) {
      const last = segments[segments.length - 1];
      if (last !== 'index.html' && last !== 'index') {
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
               window.location.href = `${import.meta.env.BASE_URL}?user=${input}`.replace(/\/\//g, '/').replace(/\/\?/g, '/?');
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
