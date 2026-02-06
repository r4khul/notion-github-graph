import { useState, useEffect } from 'react';
import { ContributionGraph } from './components/ContributionGraph';

function App() {
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Handle Theme
    const theme = params.get('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);

    // Handle Username
    const base = import.meta.env.BASE_URL;
    const path = window.location.pathname;
    const relativePath = path.startsWith(base) ? path.slice(base.length) : path;
    const segments = relativePath.split('/').filter(Boolean);
    
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

  if (!username) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh', 
        textAlign: 'center',
        padding: '2rem',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{ 
            background: 'var(--color-level-4)', 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
        }}>
            <svg height="24" viewBox="0 0 16 16" width="24" fill="var(--btn-text)">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
            </svg>
        </div>
        <h1 style={{ fontWeight: 700, fontSize: '32px', marginBottom: '12px', letterSpacing: '-0.02em' }}>Notion GitHub Graph</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '18px', lineHeight: '1.5' }}>
          Embed your GitHub contribution heat-map into Notion with a distraction-free, native aesthetics.
        </p>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const input = (e.currentTarget.elements.namedItem('username') as HTMLInputElement).value;
            if (input) {
               const params = new URLSearchParams(window.location.search);
               const theme = params.get('theme');
               let url = `${import.meta.env.BASE_URL}?user=${input}`;
               if (theme) url += `&theme=${theme}`;
               window.location.href = url.replace(/\/\//g, '/').replace(/\/\?/g, '/?');
            }
          }}
          style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '400px' }}
        >
          <input 
            name="username" 
            placeholder="Enter GitHub username" 
            style={{ 
              padding: '12px 16px', 
              borderRadius: '8px', 
              border: '1px solid var(--color-level-0)',
              background: 'var(--color-level-0)',
              color: 'var(--text-color)',
              outline: 'none',
              flex: 1,
              fontSize: '16px',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-level-3)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-level-0)'}
          />
          <button 
            type="submit"
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              background: 'var(--color-level-4)',
              color: 'var(--btn-text)',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
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

