import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// --- Constants ---

const SQUARE_SIZE = 10;
const GAP = 3;
const WEEK_WIDTH = SQUARE_SIZE + GAP;
const GRAPH_HEIGHT = (SQUARE_SIZE + GAP) * 7 - GAP; // 7 days
// We often show 52 or 53 weeks. Let's calculate dynamically or fixed.
// GitHub usually shows 53 columns.

// --- Helper: Group Data by Weeks ---

const processData = (contributions: Contribution[]) => {
  if (contributions.length === 0) return [];

  // Sort by date just in case
  const sorted = [...contributions].sort((a, b) => a.date.localeCompare(b.date));
  
  // We want to display the last year.
  // The API returns a full year or "lastYear" range.
  // Usually jogruber 'last' returns ~365 days ending today/yesterday.
  
  // Initialize weeks
  const weeks: (Contribution | null)[][] = [];
  let currentWeek: (Contribution | null)[] = [];
  
  // Pad the first week if the start date isn't Sunday
  // GitHub starts on Sunday (0)
  const startDate = parseISO(sorted[0].date);
  const startDay = getDay(startDate); // 0 = Sunday
  
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

  // Push incomplete last week
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
  const [hovered, setHovered] = useState<{ x: number; y: number; data: Contribution } | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);
        if (!res.ok) {
          throw new Error('User not found or API error');
        }
        const json: ApiData = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  const weeks = useMemo(() => {
    if (!data?.contributions) return [];
    return processData(data.contributions);
  }, [data]);

  const totalContributions = data?.total?.lastYear ?? 0;

  // Render State ---------------------------------------

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        {error}
      </div>
    );
  }

  if (loading) {
    // Simple pulse loading skeleton
    return (
      <div style={{ padding: '1rem', width: '100%', maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ height: '1rem', width: '150px', background: 'var(--color-level-0)', borderRadius: '4px', marginBottom: '1rem', opacity: 0.5 }} />
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
            {Array.from({ length: 300 }).map((_, i) => (
               <div key={i} style={{ width: '10px', height: '10px', background: 'var(--color-level-0)', borderRadius: '2px', opacity: 0.3 }} />
            ))}
          </div>
      </div>
    );
  }

  // Calculate ViewBox Dimensions
  const graphWidth = weeks.length * WEEK_WIDTH - GAP;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'flex-start',
      width: '100%',
      // We rely on body/container styles for layout, but ensure no overflow here
      position: 'relative',
    }}>
      
      {/* Header */}
      <h2 style={{ 
        fontSize: '16px', 
        fontWeight: 400, 
        color: 'var(--text-color)', 
        margin: '0 0 16px 0',
        opacity: 0.9 
      }}>
        <span style={{ fontWeight: 600 }}>{totalContributions}</span> contributions in the last year
      </h2>

      {/* Graph Area */}
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <svg 
          viewBox={`0 0 ${graphWidth} ${GRAPH_HEIGHT}`} 
          style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '100%' }}
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
                    rx={2} // Rounded corners
                    ry={2}
                    fill={`var(--color-level-${day.level})`}
                    style={{ transition: 'fill 0.2s ease-in-out', cursor: 'pointer' }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      // We need relative coordinates for the tooltip to be positioned absolutely within a relative container,
                      // OR we use fixed positioning. Since we are in an iframe/widget, fixed might be weird if scrolled.
                      // Let's passed the rect data.
                      setHovered({ x: rect.left + rect.width / 2, y: rect.top, data: day });
                    }}
                    onMouseLeave={() => setHovered(null)}
                  />
                );
              })}
            </g>
          ))}
        </svg>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <Tooltip 
             day={hovered.data} 
             x={hovered.x} 
             y={hovered.y} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Tooltip Component ---

const Tooltip = ({ day, x, y }: { day: Contribution, x: number, y: number }) => {
  // We need to format the date nicely: "9 contributions on Feb 6, 2026"
  const dateStr = format(parseISO(day.date), 'MMM d, yyyy');
  const countStr = day.count === 0 ? 'No contributions' : `${day.count} contributions`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{
        position: 'fixed', // Use fixed to break out of SVG/overflow contexts
        top: y - 8, // slightly above
        left: x,
        transform: 'translate(-50%, -100%)', // Centered and above
        backgroundColor: 'var(--tooltip-bg)',
        color: 'var(--tooltip-text)',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 1000,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '2px' }}>{countStr}</div>
      <div style={{ opacity: 0.7 }}>{dateStr}</div>
      
      {/* Little arrow maybe? optional. */}
      <div style={{
        position: 'absolute',
        bottom: '-4px',
        left: '50%',
        marginLeft: '-4px',
        width: '8px',
        height: '8px',
        backgroundColor: 'var(--tooltip-bg)',
        transform: 'rotate(45deg)',
      }} />
    </motion.div>
  );
};
