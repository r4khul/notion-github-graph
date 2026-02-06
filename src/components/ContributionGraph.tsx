import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { format, parseISO, getDay } from 'date-fns';

// --- Types ---

interface Contribution {
  date: string;
  count: number;
  level: number;
}

interface ApiData {
  total: {
    [key: string]: number;
  };
  contributions: Contribution[];
}

interface ContributionGraphProps {
  username: string;
}

interface TooltipData {
  rect: DOMRect;
  data: Contribution;
}

// --- Constants ---

const SQUARE_SIZE = 10;
const GAP = 3;
const WEEK_WIDTH = SQUARE_SIZE + GAP;
const GRAPH_HEIGHT = (SQUARE_SIZE + GAP) * 7 - GAP;
const TOOLTIP_OFFSET = 8;

// --- SVGs ---

const GithubIcon = () => (
  <svg height="16" viewBox="0 0 16 16" width="16" fill="currentColor" style={{ flexShrink: 0, color: 'var(--text-color)' }}>
    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.0" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-color)' }}>
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="11 13 6 8 11 3" />
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="5 13 10 8 5 3" />
  </svg>
);

// --- Helper Functions ---

const processData = (contributions: Contribution[]) => {
  if (contributions.length === 0) return [];
  const sorted = [...contributions].sort((a, b) => a.date.localeCompare(b.date));
  const weeks: (Contribution | null)[][] = [];
  let currentWeek: (Contribution | null)[] = [];
  
  const startDate = parseISO(sorted[0].date);
  const startDay = getDay(startDate);
  
  for (let i = 0; i < startDay; i++) {
    currentWeek.push(null);
  }

  sorted.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }
  return weeks;
};

// --- Component ---

export const ContributionGraph: React.FC<ContributionGraphProps> = ({ username }) => {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<string>('last');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [hovered, setHovered] = useState<TooltipData | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTouch, setActiveTouch] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close tooltip on outside click for mobile
  useEffect(() => {
    if (!isMobile || !activeTouch) return;
    
    const handleOutsideClick = (e: TouchEvent | MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setActiveTouch(null);
        setHovered(null);
      }
    };
    
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isMobile, activeTouch]);

  useEffect(() => {
    if (!username) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=${year}`);
        if (!res.ok) {
          throw new Error('User not found or API error');
        }
        const json: ApiData = await res.json();
        setData(json);

        // Extract available years on first load
        if (availableYears.length === 0 && json.total) {
          const years = Object.keys(json.total)
            .filter(y => y !== 'lastYear')
            .sort((a, b) => Number(b) - Number(a)); // Sort numerically descending
          setAvailableYears(years);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username, year, availableYears.length]);

  // Scroll to end (show recent data) on load
  useEffect(() => {
    if (scrollRef.current && !loading) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [loading]);

  const weeks = useMemo(() => {
    if (!data?.contributions) return [];
    return processData(data.contributions);
  }, [data]);

  const totalContributions = data?.total?.[year === 'last' ? 'lastYear' : year] ?? 0;

  // Year navigation with proper boundary handling
  const currentYearIndex = useMemo(() => {
    if (year === 'last') return -1; // Special case: 'last' is most recent
    return availableYears.indexOf(year);
  }, [year, availableYears]);

  const canGoPrev = useMemo(() => {
    if (availableYears.length === 0) return false;
    if (year === 'last') return true; // Can go from 'last' to most recent year
    return currentYearIndex < availableYears.length - 1;
  }, [year, currentYearIndex, availableYears]);

  const canGoNext = useMemo(() => {
    if (availableYears.length === 0) return false;
    return year !== 'last';
  }, [year, availableYears]);

  const handleYearChange = useCallback((dir: 'prev' | 'next') => {
    if (dir === 'prev' && canGoPrev) {
      if (year === 'last') {
        // Go from 'last' to the most recent actual year
        setYear(availableYears[0]);
      } else {
        // Go to older year
        setYear(availableYears[currentYearIndex + 1]);
      }
    } else if (dir === 'next' && canGoNext) {
      if (currentYearIndex === 0) {
        // At most recent year, go to 'last'
        setYear('last');
      } else {
        // Go to newer year
        setYear(availableYears[currentYearIndex - 1]);
      }
    }
  }, [year, currentYearIndex, availableYears, canGoPrev, canGoNext]);

  // Calculate tooltip position precisely relative to the tile
  const handleTileInteraction = useCallback((e: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>, day: Contribution) => {
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    if (!containerRef.current) return;
    
    setHovered({ rect, data: day });
    setActiveTouch(day.date);
  }, []);

  const handleTileMouseEnter = useCallback((e: React.MouseEvent<SVGRectElement>, day: Contribution) => {
    if (isMobile) return; // On mobile, use touch events only
    handleTileInteraction(e, day);
  }, [isMobile, handleTileInteraction]);

  const handleTileMouseLeave = useCallback(() => {
    if (isMobile) return;
    setHovered(null);
  }, [isMobile]);

  const handleTileTouch = useCallback((e: React.TouchEvent<SVGRectElement>, day: Contribution) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (activeTouch === day.date) {
      // Second tap on same tile - dismiss
      setActiveTouch(null);
      setHovered(null);
    } else {
      handleTileInteraction(e, day);
    }
  }, [activeTouch, handleTileInteraction]);

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px', 
        color: 'var(--text-secondary)', 
        gap: '1rem',
        padding: '1rem'
      }}>
        <p style={{ margin: 0, textAlign: 'center' }}>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            padding: '8px 16px', 
            background: 'var(--color-level-1)', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            color: 'var(--text-color)',
            fontWeight: 500
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const graphWidth = weeks.length * WEEK_WIDTH - GAP;

  return (
    <div 
      ref={containerRef}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        width: '100%',
        maxWidth: '900px',
        padding: 'clamp(0.75rem, 3vw, 1.5rem)',
        boxSizing: 'border-box',
        margin: '0 auto',
      }}
    >
      {/* Header Container */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: 'clamp(12px, 3vw, 20px)',
        flexWrap: 'wrap',
        gap: '12px',
        minHeight: '48px'
      }}>
        {/* User Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 auto', minWidth: '150px' }}>
          <a 
            href={`https://github.com/${username}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'inline-flex',
              alignItems: 'center', 
              gap: '8px',
              textDecoration: 'none',
              width: 'fit-content',
              opacity: 0.8,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
          >
            <GithubIcon />
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
              }}
            >
              <span 
                style={{ 
                  fontSize: 'clamp(13px, 2vw, 14px)', 
                  fontWeight: 600, 
                  color: 'var(--text-color)', 
                }}
              >
                @{username}
              </span>
              <ExternalLinkIcon />
            </div>
          </a>
          <h2 style={{ 
            fontSize: 'clamp(16px, 4vw, 20px)', 
            fontWeight: 600, 
            color: 'var(--text-color)', 
            margin: 0,
            lineHeight: 1.2
          }}>
            {loading ? '—' : totalContributions.toLocaleString()} 
            <span style={{ fontWeight: 400, opacity: 0.7, fontSize: 'clamp(14px, 3vw, 16px)', marginLeft: '4px' }}>
              contributions
            </span>
          </h2>
        </div>

        {/* Year Selector */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px', 
          background: 'var(--color-level-0)', 
          padding: '4px 6px', 
          borderRadius: '8px',
          flexShrink: 0,
          userSelect: 'none'
        }}>
          <button 
            onClick={() => handleYearChange('prev')}
            disabled={!canGoPrev || loading}
            aria-label="Previous year"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-color)', 
              cursor: canGoPrev && !loading ? 'pointer' : 'not-allowed', 
              padding: '6px', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: canGoPrev && !loading ? 0.7 : 0.3,
              borderRadius: '4px',
              transition: 'opacity 0.15s, background-color 0.15s'
            }}
            onMouseEnter={(e) => { if (canGoPrev && !loading) e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { if (canGoPrev && !loading) e.currentTarget.style.opacity = '0.7'; }}
          >
            <ChevronLeft />
          </button>
          <span style={{ 
            fontSize: 'clamp(12px, 2vw, 13px)', 
            fontWeight: 600, 
            minWidth: '70px', 
            textAlign: 'center',
            color: 'var(--text-color)'
          }}>
            {year === 'last' ? 'Last Year' : year}
          </span>
          <button 
            onClick={() => handleYearChange('next')}
            disabled={!canGoNext || loading}
            aria-label="Next year"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-color)', 
              cursor: canGoNext && !loading ? 'pointer' : 'not-allowed', 
              padding: '6px', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: canGoNext && !loading ? 0.7 : 0.3,
              borderRadius: '4px',
              transition: 'opacity 0.15s, background-color 0.15s'
            }}
            onMouseEnter={(e) => { if (canGoNext && !loading) e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { if (canGoNext && !loading) e.currentTarget.style.opacity = '0.7'; }}
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Graph Area */}
      <div 
        ref={scrollRef}
        style={{ 
          width: '100%', 
          overflowX: 'auto', 
          overflowY: 'visible',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '8px',
          paddingTop: '4px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--color-level-1) transparent',
        }}
      >
        <div 
          ref={graphContainerRef} 
          style={{ 
            position: 'relative', 
            width: `${graphWidth}px`,
            minWidth: `${graphWidth}px`
          }}
        >
          {loading ? (
            <div style={{ height: GRAPH_HEIGHT, display: 'flex', gap: GAP }}>
              {Array.from({ length: 53 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <div 
                      key={j} 
                      style={{ 
                        width: SQUARE_SIZE, 
                        height: SQUARE_SIZE, 
                        background: 'var(--color-level-0)', 
                        borderRadius: '2px', 
                        opacity: 0.5,
                        animation: 'pulse 1.5s ease-in-out infinite'
                      }} 
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <svg 
              width={graphWidth}
              height={GRAPH_HEIGHT}
              viewBox={`0 0 ${graphWidth} ${GRAPH_HEIGHT}`} 
              style={{ display: 'block', overflow: 'visible' }}
            >
              {weeks.map((week, wIndex) => (
                <g key={wIndex} transform={`translate(${wIndex * WEEK_WIDTH}, 0)`}>
                  {week.map((day, dIndex) => {
                    if (!day) return null;
                    return (
                      <rect
                        key={day.date}
                        x={0}
                        y={dIndex * (SQUARE_SIZE + GAP)}
                        width={SQUARE_SIZE}
                        height={SQUARE_SIZE}
                        rx={2}
                        ry={2}
                        fill={`var(--color-level-${day.level})`}
                        style={{ 
                          cursor: 'pointer', 
                          outline: 'none'
                        }}
                        onMouseEnter={(e) => handleTileMouseEnter(e, day)}
                        onMouseLeave={handleTileMouseLeave}
                        onTouchStart={(e) => handleTileTouch(e, day)}
                      />
                    );
                  })}
                </g>
              ))}
            </svg>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-end', 
        gap: '4px', 
        marginTop: 'clamp(8px, 2vw, 12px)', 
        fontSize: 'clamp(10px, 2vw, 11px)', 
        opacity: 0.7,
        color: 'var(--text-color)'
      }}>
        <span>Less</span>
        {[0, 1, 2, 3, 4].map(l => (
          <div 
            key={l} 
            style={{ 
              width: 'clamp(8px, 2vw, 10px)', 
              height: 'clamp(8px, 2vw, 10px)', 
              background: `var(--color-level-${l})`, 
              borderRadius: '2px' 
            }} 
          />
        ))}
        <span>More</span>
      </div>

      {/* Tooltip - Pixel-perfect positioning */}
      <AnimatePresence>
        {hovered && (
          <Tooltip 
            day={hovered.data} 
            targetRect={hovered.rect}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

// --- Tooltip Component with Pixel-Perfect Positioning ---

interface TooltipProps {
  day: Contribution;
  targetRect: DOMRect;
  isMobile: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ day, targetRect, isMobile }) => {
  const [coords, setCoords] = useState<{ top: number; left: number; arrowOffset: number; flipped: boolean } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const dateStr = format(parseISO(day.date), 'MMM d, yyyy');
  const countStr = day.count === 0 ? 'No contributions' : `${day.count} ${day.count === 1 ? 'contribution' : 'contributions'}`;

  // Production-grade positioning logic: useLayoutEffect to prevent flash of unstyled content/position
  React.useLayoutEffect(() => {
    if (!tooltipRef.current) return;

    const tooltip = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const padding = 12;

    // Ideal position: Centered above the tile
    let left = targetRect.left + targetRect.width / 2;
    let arrowOffset = 0;
    
    // Final vertical position logic
    const spaceAbove = targetRect.top;
    const requiredSpace = tooltip.height + TOOLTIP_OFFSET + padding;
    const flipped = spaceAbove < requiredSpace;

    let top = flipped 
      ? targetRect.bottom + TOOLTIP_OFFSET 
      : targetRect.top - TOOLTIP_OFFSET;

    // Viewport bound enforcement (Horizontal)
    const halfWidth = tooltip.width / 2;
    if (left - halfWidth < padding) {
      // Shift right if too far left
      const idealLeft = left;
      left = halfWidth + padding;
      arrowOffset = idealLeft - left;
    } else if (left + halfWidth > viewportWidth - padding) {
      // Shift left if too far right
      const idealLeft = left;
      left = viewportWidth - halfWidth - padding;
      arrowOffset = idealLeft - left;
    }

    setCoords({ top, left, arrowOffset, flipped });
  }, [targetRect]);

  // Use a portal to render at the top level, avoiding any parent clipping or stacking issues
  return createPortal(
    <motion.div
      ref={tooltipRef}
      initial={{ opacity: 0, scale: 0.95, y: coords?.flipped ? -4 : 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: coords?.flipped ? -4 : 4 }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: coords?.top ?? -1000,
        left: coords?.left ?? -1000,
        transform: coords?.flipped ? 'translateX(-50%)' : 'translate(-50%, -100%)',
        backgroundColor: 'var(--tooltip-bg)',
        color: 'var(--tooltip-text)',
        padding: isMobile ? '10px 14px' : '8px 12px',
        borderRadius: '10px',
        fontSize: isMobile ? '13px' : '12px',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 99999,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        visibility: coords ? 'visible' : 'hidden'
      }}
    >
      <div style={{ fontWeight: 600, letterSpacing: '-0.02em', color: 'inherit' }}>{countStr}</div>
      <div style={{ opacity: 0.6, fontSize: isMobile ? '12px' : '11px', fontWeight: 500 }}>{dateStr}</div>
      
      {/* Dynamic arrow that stays focused on the tile even when tooltip shifts */}
      <div style={{
        position: 'absolute',
        [coords?.flipped ? 'top' : 'bottom']: '-5px',
        left: `calc(50% + ${coords?.arrowOffset ?? 0}px)`,
        transform: `translateX(-50%) ${coords?.flipped ? 'rotate(180deg)' : ''}`,
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid var(--tooltip-bg)',
      }} />
    </motion.div>,
    document.body
  );
};
