import { useState, useEffect } from 'react';
import { ContributionGraph } from './components/ContributionGraph';

function App() {
  const [username, setUsername] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('dark');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Handle Theme
    const theme = params.get('theme') || 'dark';
    setSelectedTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);

    // Handle Toast and Copy
    if (params.get('generated') === '1') {
      const currentUrl = window.location.href.replace('&generated=1', '').replace('?generated=1&', '?').replace('?generated=1', '');
      navigator.clipboard.writeText(currentUrl).then(() => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      });
      
      // Clean up URL without reload
      const newUrl = currentUrl;
      window.history.replaceState({}, '', newUrl);
    }

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
               let url = `${import.meta.env.BASE_URL}?user=${input}&theme=${selectedTheme}&generated=1`;
               window.location.href = url.replace(/\/\//g, '/').replace(/\/\?/g, '/?');
            }
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '400px' }}
        >
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <input 
              name="username" 
              placeholder="Enter GitHub username" 
              autoComplete="off"
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
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Theme</span>
            <select 
              value={selectedTheme}
              className="theme-select"
              onChange={(e) => {
                const theme = e.target.value;
                setSelectedTheme(theme);
                document.documentElement.setAttribute('data-theme', theme);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'var(--color-level-0)',
                color: 'var(--text-color)',
                border: '1px solid var(--color-level-1)',
                fontSize: '14px',
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '140px'
              }}
            >
              <option value="dark">Dark Theme</option>
              <option value="light">Light Theme</option>
            </select>
          </div>
        </form>
      </div>
    );
  }

  return (
    <>
      <ContributionGraph username={username} />
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--color-level-4)',
          color: 'var(--btn-text)',
          padding: '14px 28px',
          borderRadius: '100px',
          fontWeight: 600,
          boxShadow: '0 12px 24px rgba(0,0,0,0.25)',
          zIndex: 1000,
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          whiteSpace: 'nowrap',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            width: '24px',
            height: '24px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span>Graph embed link copied to clipboard!</span>
        </div>
      )}
    </>
  );
}


export default App;


