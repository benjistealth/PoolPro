import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Trophy, 
  Settings, 
  Timer, 
  RotateCcw, 
  User, 
  Play, 
  Pause, 
  Plus, 
  Minus, 
  Trash2,
  CheckCircle2,
  Circle,
  Palette,
  Maximize,
  Minimize,
  Layout,
  Users,
  Download,
  Upload,
  X,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Player, MatchHistoryEntry } from './types';
import { THEME_COLORS, BACKGROUND_COLORS } from './constants';
import { ColorPicker } from './components/ColorPicker';

const SHOT_CLOCK_DEFAULT = 30;

export default function App() {
  // --- State ---
  const [player1, setPlayer1] = useState<Player>({ id: '1', name: 'Player 1', score: 0, isTurn: true, color: '#FFFFFF', bgColor: '#881337', screenColor: '#000000' });
  const [player2, setPlayer2] = useState<Player>({ id: '2', name: 'Player 2', score: 0, isTurn: false, color: '#FFFFFF', bgColor: '#1e3a8a', screenColor: '#000000' });
  const [team1Name, setTeam1Name] = useState<string>('TEAM 1');
  const [team2Name, setTeam2Name] = useState<string>('TEAM 2');
  const [team1Players, setTeam1Players] = useState<string[]>([]);
  const [team2Players, setTeam2Players] = useState<string[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryEntry[]>([]);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState<number | null>(null);
  const [view, setView] = useState<'scoreboard' | 'history' | 'settings' | 'teams'>('scoreboard');
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const navTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard detection for mobile
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setIsKeyboardOpen(true);
        setIsNavVisible(false);
      }
    };

    const handleFocusOut = () => {
      setIsKeyboardOpen(false);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // Effect 1: Auto-hide timer for navigation bar
  useEffect(() => {
    if (!isNavVisible || isKeyboardOpen || view !== 'scoreboard') return;

    const timeout = setTimeout(() => {
      setIsNavVisible(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isNavVisible, isKeyboardOpen, view]);

  // Effect 2: Show navigation bar on interaction
  useEffect(() => {
    const showNav = () => {
      if (!isNavVisible && !isKeyboardOpen) {
        setIsNavVisible(true);
      }
    };

    const handleInteraction = (e: Event) => {
      if (isKeyboardOpen) return;
      
      // If nav is already visible, reset the timer on any interaction (handled by Effect 1)
      if (isNavVisible) return;

      // Specific triggers to SHOW the nav
      if (e.type === 'click' || e.type === 'touchstart') {
        const clientY = e.type === 'click' 
          ? (e as MouseEvent).clientY 
          : (e as TouchEvent).touches[0].clientY;
        
        // Show if tap in top 8% of screen
        if (clientY <= window.innerHeight * 0.08) {
          showNav();
        }
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      handleInteraction(e);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      // Swipe down from top area (top 100px) to show nav
      if (touchStartY < 100 && touchEndY > touchStartY + 30) {
        showNav();
      }
    };

    window.addEventListener('click', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    if (window.innerWidth >= 1024) {
      window.addEventListener('mousemove', (e) => {
        if (e.clientY <= window.innerHeight * 0.08) showNav();
      }, { passive: true });
    }

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isNavVisible, isKeyboardOpen]);
  const [activePicker, setActivePicker] = useState<string | null>(null);
  const [shotClock, setShotClock] = useState(SHOT_CLOCK_DEFAULT);
  const [shotClockDuration, setShotClockDuration] = useState(SHOT_CLOCK_DEFAULT);
  const [isShotClockEnabled, setIsShotClockEnabled] = useState(false);
  const [matchClock, setMatchClock] = useState(600);
  const [matchClockDuration, setMatchClockDuration] = useState(600);
  const [isMatchClockEnabled, setIsMatchClockEnabled] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isEditingNames, setIsEditingNames] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showClearTeamsConfirm, setShowClearTeamsConfirm] = useState(false);
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);
  const [showTeamTotals, setShowTeamTotals] = useState(false);
  const [showRestoreDefaultsConfirm, setShowRestoreDefaultsConfirm] = useState(false);

  // --- Refs ---
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMatchResult = (p1: string, p2: string) => {
    if (!p1 || !p2) return null;
    return matchHistory.find(m => 
      (m.player1 === p1 && m.player2 === p2) || 
      (m.player1 === p2 && m.player2 === p1)
    );
  };

  const teamTotals = useMemo(() => {
    let t1 = 0;
    let t2 = 0;
    const maxMatches = Math.max(team1Players.length, team2Players.length);
    
    for (let i = 0; i < maxMatches; i++) {
      const p1Name = team1Players[i] || `PLAYER ${i + 1}`;
      const p2Name = team2Players[i] || `PLAYER ${i + 1}`;
      
      if (selectedMatchIndex === i) {
        t1 += player1.score;
        t2 += player2.score;
      } else {
        const match = getMatchResult(p1Name, p2Name);
        if (match) {
          if (match.player1 === p1Name) {
            t1 += match.score1;
            t2 += match.score2;
          } else {
            t1 += match.score2;
            t2 += match.score1;
          }
        }
      }
    }
    return { t1, t2 };
  }, [team1Players, team2Players, matchHistory, selectedMatchIndex, player1.score, player2.score]);

  // --- Initialization ---
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('pool_match_history');
      if (savedHistory) {
        setMatchHistory(JSON.parse(savedHistory));
      }
      const savedTeam1Name = localStorage.getItem('pool_team1_name');
      const savedTeam2Name = localStorage.getItem('pool_team2_name');
      const savedTeam1Players = localStorage.getItem('pool_team1_players');
      const savedTeam2Players = localStorage.getItem('pool_team2_players');
      const savedPlayer1 = localStorage.getItem('pool_player1_settings');
      const savedPlayer2 = localStorage.getItem('pool_player2_settings');
      
      if (savedTeam1Name) setTeam1Name(savedTeam1Name);
      if (savedTeam2Name) setTeam2Name(savedTeam2Name);
      if (savedTeam1Players) setTeam1Players(JSON.parse(savedTeam1Players));
      if (savedTeam2Players) setTeam2Players(JSON.parse(savedTeam2Players));
      if (savedPlayer1) setPlayer1(JSON.parse(savedPlayer1));
      if (savedPlayer2) setPlayer2(JSON.parse(savedPlayer2));
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      // Fallback to defaults is already handled by initial state
    }
  }, []);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('pool_player1_settings', JSON.stringify(player1));
  }, [player1]);

  useEffect(() => {
    localStorage.setItem('pool_player2_settings', JSON.stringify(player2));
  }, [player2]);

  useEffect(() => {
    localStorage.setItem('pool_team1_name', team1Name);
  }, [team1Name]);

  useEffect(() => {
    localStorage.setItem('pool_team2_name', team2Name);
  }, [team2Name]);

  useEffect(() => {
    localStorage.setItem('pool_team1_players', JSON.stringify(team1Players));
  }, [team1Players]);

  useEffect(() => {
    localStorage.setItem('pool_team2_players', JSON.stringify(team2Players));
  }, [team2Players]);

  useEffect(() => {
    localStorage.setItem('pool_match_history', JSON.stringify(matchHistory));
  }, [matchHistory]);

  // --- Timer Logic ---
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(true);
    timerRef.current = setInterval(() => {
      if (isShotClockEnabled) {
        setShotClock((prev) => Math.max(0, prev - 1));
      }
      if (isMatchClockEnabled) {
        setMatchClock((prev) => Math.max(0, prev - 1));
      }
    }, 1000);
  }, [isShotClockEnabled, isMatchClockEnabled]);

  const pauseTimer = useCallback(() => {
    setIsTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (isTimerRunning) {
      const shotClockFinished = isShotClockEnabled && shotClock === 0;
      const matchClockFinished = isMatchClockEnabled && matchClock === 0;
      
      if (shotClockFinished || matchClockFinished) {
        pauseTimer();
      }
    }
  }, [shotClock, matchClock, isTimerRunning, isShotClockEnabled, isMatchClockEnabled, pauseTimer]);

  const resetTimer = useCallback(() => {
    setShotClock(shotClockDuration);
    if (isTimerRunning && (isShotClockEnabled || isMatchClockEnabled)) startTimer();
  }, [isTimerRunning, startTimer, shotClockDuration, isShotClockEnabled, isMatchClockEnabled]);

  const resetMatchClock = useCallback(() => {
    setMatchClock(matchClockDuration);
  }, [matchClockDuration]);

  // --- Game Actions ---
  const incrementScore = (playerId: string) => {
    if (playerId === '1') {
      setPlayer1(prev => ({ ...prev, score: prev.score + 1 }));
    } else {
      setPlayer2(prev => ({ ...prev, score: prev.score + 1 }));
    }
    resetTimer();
  };

  const decrementScore = (playerId: string) => {
    if (playerId === '1') {
      setPlayer1(prev => ({ ...prev, score: Math.max(0, prev.score - 1) }));
    } else {
      setPlayer2(prev => ({ ...prev, score: Math.max(0, prev.score - 1) }));
    }
  };

  const finishMatch = () => {
    const winner = player1.score > player2.score ? player1.name : player2.name;
    const newEntry: MatchHistoryEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      player1: player1.name,
      player2: player2.name,
      team1: team1Name || undefined,
      team2: team2Name || undefined,
      score1: player1.score,
      score2: player2.score,
      winner,
      shotClockSetting: isShotClockEnabled ? shotClockDuration : undefined,
      matchClockRemaining: isMatchClockEnabled ? matchClock : undefined
    };

    const updatedHistory = [newEntry, ...matchHistory];
    setMatchHistory(updatedHistory);
    localStorage.setItem('pool_match_history', JSON.stringify(updatedHistory));
    
    // Move to next matchup if available
    if (selectedMatchIndex !== null) {
      const nextIndex = selectedMatchIndex + 1;
      const maxMatches = Math.max(team1Players.length, team2Players.length);
      
      if (nextIndex < maxMatches) {
        selectTeamMatch(nextIndex);
      } else {
        // Show team totals if it was the last match
        setShowTeamTotals(true);
        
        // Reset game if no more matches
        setPlayer1(prev => ({ ...prev, score: 0 }));
        setPlayer2(prev => ({ ...prev, score: 0 }));
        setSelectedMatchIndex(null);
        resetTimer();
      }
    } else {
      // Reset game for non-team matches
      setPlayer1(prev => ({ ...prev, score: 0 }));
      setPlayer2(prev => ({ ...prev, score: 0 }));
      resetTimer();
    }
  };

  const clearMatchResult = (p1: string, p2: string) => {
    const updatedHistory = matchHistory.filter(m => 
      !((m.player1 === p1 && m.player2 === p2) || (m.player1 === p2 && m.player2 === p1))
    );
    setMatchHistory(updatedHistory);
    localStorage.setItem('pool_match_history', JSON.stringify(updatedHistory));
  };

  const selectTeamMatch = (index: number) => {
    const p1Name = team1Players[index] || `PLAYER ${index + 1}`;
    const p2Name = team2Players[index] || `PLAYER ${index + 1}`;
    
    setPlayer1(prev => ({ ...prev, name: p1Name, score: 0 }));
    setPlayer2(prev => ({ ...prev, name: p2Name, score: 0 }));
    setSelectedMatchIndex(index);
    setView('scoreboard');
    resetTimer();
  };

  const navigateToScoreboard = () => {
    const maxMatches = Math.max(team1Players.length, team2Players.length);
    
    // If we're already on scoreboard and have a match, just stay
    if (view === 'scoreboard' && selectedMatchIndex !== null) return;

    if (maxMatches > 0) {
      // Find the first match with no data
      let firstUnplayedIndex = -1;
      for (let i = 0; i < maxMatches; i++) {
        const p1Name = team1Players[i] || `PLAYER ${i + 1}`;
        const p2Name = team2Players[i] || `PLAYER ${i + 1}`;
        if (!getMatchResult(p1Name, p2Name)) {
          firstUnplayedIndex = i;
          break;
        }
      }
      
      // If all matches have data, just select the first one (top row)
      const indexToSelect = firstUnplayedIndex !== -1 ? firstUnplayedIndex : 0;
      selectTeamMatch(indexToSelect);
    } else {
      setView('scoreboard');
    }
  };

  const clearTeams = () => {
    setTeam1Name('TEAM 1');
    setTeam2Name('TEAM 2');
    setTeam1Players([]);
    setTeam2Players([]);
    setSelectedMatchIndex(null);
    localStorage.removeItem('pool_team1_name');
    localStorage.removeItem('pool_team2_name');
    localStorage.removeItem('pool_team1_players');
    localStorage.removeItem('pool_team2_players');
    setShowClearTeamsConfirm(false);
  };

  const updateTeamData = (
    t1Name: string, 
    t1Players: string[], 
    t2Name: string, 
    t2Players: string[]
  ) => {
    setTeam1Name(t1Name);
    setTeam1Players(t1Players);
    setTeam2Name(t2Name);
    setTeam2Players(t2Players);
    
    localStorage.setItem('pool_team1_name', t1Name);
    localStorage.setItem('pool_team2_name', t2Name);
    localStorage.setItem('pool_team1_players', JSON.stringify(t1Players));
    localStorage.setItem('pool_team2_players', JSON.stringify(t2Players));
  };

  const parseTime = (timeStr: string) => {
    if (!timeStr || timeStr === 'OFF') return undefined;
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return parseInt(timeStr);
  };

  const downloadData = () => {
    if (matchHistory.length === 0) {
      // If no history, just download team info
      const headers = ['Team', 'Player Name'];
      let csvContent = headers.join(',') + '\n';
      
      team1Players.forEach(p => csvContent += `${team1Name},${p}\n`);
      team2Players.forEach(p => csvContent += `${team2Name},${p}\n`);
      
      const now = new Date();
      const ukDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
      const fileName = `${team1Name.replace(/\s+/g, '_')}_V_${team2Name.replace(/\s+/g, '_')}_${ukDate}.csv`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    const headers = ['Date', 'Team 1', 'Player 1', 'Score 1', 'Team 2', 'Player 2', 'Score 2', 'Winner', 'Shot Clock Setting', 'Match Clock Remaining'];
    const rows = matchHistory.map(entry => [
      new Date(entry.date).toLocaleString('en-GB'),
      entry.team1 || 'N/A',
      entry.player1,
      entry.score1,
      entry.team2 || 'N/A',
      entry.player2,
      entry.score2,
      entry.winner,
      entry.shotClockSetting ? `${entry.shotClockSetting}s` : 'OFF',
      entry.matchClockRemaining !== undefined ? formatTime(entry.matchClockRemaining) : 'OFF'
    ]);

    let csvContent = headers.join(',') + '\n' + 
                     rows.map(e => e.map(val => `"${val}"`).join(',')).join('\n');
    
    const now = new Date();
    const ukDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const fileName = `${team1Name.replace(/\s+/g, '_')}_V_${team2Name.replace(/\s+/g, '_')}_${ukDate}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const uploadData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (!content) return;

        try {
          const lines = content.split('\n').map(l => l.trim()).filter(l => l);
          if (lines.length < 2) return;

          const parseCSVLine = (line: string) => {
            const values: string[] = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            values.push(current.trim());
            return values;
          };

          const headers = parseCSVLine(lines[0]);
          
          if (headers[0] === 'Team' && headers[1] === 'Player Name') {
            const t1Players: string[] = [];
            const t2Players: string[] = [];
            let t1Name = 'TEAM 1';
            let t2Name = 'TEAM 2';

            lines.slice(1).forEach(line => {
              const values = parseCSVLine(line);
              const team = values[0];
              const player = values[1];
              if (team && player) {
                if (t1Players.length === 0) {
                  t1Name = team;
                  t1Players.push(player);
                } else if (team === t1Name) {
                  t1Players.push(player);
                } else {
                  t2Name = team;
                  t2Players.push(player);
                }
              }
            });
            
            updateTeamData(t1Name, t1Players, t2Name, t2Players);
            setMatchHistory([]);
            setSelectedMatchIndex(null);
            alert('Teams loaded successfully!');
          } else if (headers.includes('Team 1') && headers.includes('Player 1')) {
            const history: MatchHistoryEntry[] = [];
            const t1PlayersSet = new Set<string>();
            const t2PlayersSet = new Set<string>();
            let t1Name = 'TEAM 1';
            let t2Name = 'TEAM 2';

            lines.slice(1).forEach((line, idx) => {
              const values = parseCSVLine(line);
              const entry: any = {};
              headers.forEach((h, i) => {
                entry[h] = values[i];
              });

              if (idx === 0) {
                t1Name = entry['Team 1'];
                t2Name = entry['Team 2'];
              }

              if (entry['Player 1']) t1PlayersSet.add(entry['Player 1']);
              if (entry['Player 2']) t2PlayersSet.add(entry['Player 2']);

              let date = new Date().toISOString();
              if (entry['Date']) {
                const d = new Date(entry['Date']);
                if (!isNaN(d.getTime())) {
                  date = d.toISOString();
                }
              }

              history.push({
                id: `imported-${idx}-${Date.now()}`,
                date: date,
                team1: entry['Team 1'],
                player1: entry['Player 1'],
                score1: parseInt(entry['Score 1']) || 0,
                team2: entry['Team 2'],
                player2: entry['Player 2'],
                score2: parseInt(entry['Score 2']) || 0,
                winner: entry['Winner'],
                shotClockSetting: entry['Shot Clock Setting'] && entry['Shot Clock Setting'] !== 'OFF' ? parseInt(entry['Shot Clock Setting'].replace('s', '')) : undefined,
                matchClockRemaining: entry['Match Clock Remaining'] && entry['Match Clock Remaining'] !== 'OFF' ? parseTime(entry['Match Clock Remaining']) : undefined
              });
            });

            setMatchHistory(history);
            updateTeamData(t1Name, Array.from(t1PlayersSet), t2Name, Array.from(t2PlayersSet));
            setSelectedMatchIndex(null);
            alert('Match history and teams loaded successfully!');
          } else {
            alert('Unrecognized CSV format. Please use a file exported from this app.');
          }
        } catch (err) {
          console.error('Error parsing CSV:', err);
          alert('Failed to parse CSV file. Please ensure it is in the correct format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const clearHistory = () => {
    setMatchHistory([]);
    localStorage.removeItem('pool_match_history');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="relative min-h-screen text-slate-100 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* SVG Gradient Definitions */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <linearGradient id="cup-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={player1.color} />
            <stop offset="100%" stopColor={player2.color} />
          </linearGradient>
        </defs>
      </svg>

      {/* Background Layer */}
      <div className="fixed inset-0 z-[-10] overflow-hidden pointer-events-none">
        {/* Split Screen (Scoreboard only) */}
        <div className={`absolute inset-0 flex transition-opacity duration-700 ${view === 'scoreboard' ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex-1 h-full transition-colors duration-700" style={{ backgroundColor: player1.screenColor }} />
          <div className="flex-1 h-full transition-colors duration-700" style={{ backgroundColor: player2.screenColor }} />
        </div>
        
        {/* Plain Background (Teams & Settings) */}
        <div className={`absolute inset-0 bg-black transition-opacity duration-700 ${view !== 'scoreboard' ? 'opacity-100' : 'opacity-0'}`} />
        
        {/* Subtle Gradient Overlay for Plain Background */}
        <div className={`absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from),_transparent_50%)] from-emerald-500/5 transition-opacity duration-700 ${view !== 'scoreboard' ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* Navigation Bar */}
      <motion.nav 
        initial={false}
        animate={{ 
          y: (window.innerWidth < 1024 && (!isNavVisible || isKeyboardOpen)) ? -62 : 0,
          opacity: 1
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="fixed top-0 left-0 right-0 h-16 lg:h-32 bg-black/80 backdrop-blur-md z-50 flex items-center justify-between px-6 nav-zoom"
        style={{ 
          borderBottom: '2px solid',
          borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1`
        }}
      >
        <div className="flex items-center gap-2 lg:gap-4">
          <div 
            className="w-8 h-8 lg:w-16 lg:h-16 rounded-lg lg:rounded-2xl flex items-center justify-center transition-all duration-500 border border-slate-800 bg-black/50"
          >
            <Trophy 
              className="w-5 h-5 lg:w-10 lg:h-10 transition-all duration-500" 
              style={{ stroke: 'url(#cup-gradient)' }}
            />
          </div>
          <h1 
            className="text-xl lg:text-4xl font-black tracking-tight bg-clip-text text-transparent transition-all duration-500"
            style={{ backgroundImage: `linear-gradient(to right, ${player1.color}, ${player2.color})` }}
          >
            PoolPro
          </h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-8">
          <button 
            onClick={toggleFullscreen}
            className="w-9 h-9 lg:w-[72px] lg:h-[72px] rounded-lg lg:rounded-2xl flex items-center justify-center transition-all duration-500 border border-slate-800 bg-black/50 hover:bg-slate-800/50 hidden sm:flex"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? 
              <Minimize className="w-5 h-5 lg:w-10 lg:h-10" style={{ stroke: 'url(#cup-gradient)' }} /> : 
              <Maximize className="w-5 h-5 lg:w-10 lg:h-10" style={{ stroke: 'url(#cup-gradient)' }} />
            }
          </button>
          <button 
            onClick={navigateToScoreboard}
            className={`w-9 h-9 lg:w-[72px] lg:h-[72px] rounded-lg lg:rounded-2xl flex items-center justify-center transition-all duration-500 border ${view === 'scoreboard' ? 'border-white/20' : 'border-slate-800'} bg-black/50 hover:bg-slate-800/50`}
            style={view === 'scoreboard' ? { backgroundColor: `${player1.color}33` } : {}}
          >
            <Trophy className="w-5 h-5 lg:w-10 lg:h-10" style={{ stroke: 'url(#cup-gradient)' }} />
          </button>
          <button 
            onClick={() => setView('teams')}
            className={`w-9 h-9 lg:w-[72px] lg:h-[72px] rounded-lg lg:rounded-2xl flex items-center justify-center transition-all duration-500 border ${view === 'teams' ? 'border-white/20' : 'border-slate-800'} bg-black/50 hover:bg-slate-800/50`}
            style={view === 'teams' ? { backgroundColor: `${player1.color}33` } : {}}
          >
            <Users className="w-5 h-5 lg:w-10 lg:h-10" style={{ stroke: 'url(#cup-gradient)' }} />
          </button>
          <button 
            onClick={() => setView('settings')}
            className={`w-9 h-9 lg:w-[72px] lg:h-[72px] rounded-lg lg:rounded-2xl flex items-center justify-center transition-all duration-500 border ${view === 'settings' ? 'border-white/20' : 'border-slate-800'} bg-black/50 hover:bg-slate-800/50`}
            style={view === 'settings' ? { backgroundColor: `${player2.color}33` } : {}}
          >
            <Settings className="w-5 h-5 lg:w-10 lg:h-10" style={{ stroke: 'url(#cup-gradient)' }} />
          </button>
        </div>
      </motion.nav>

      <motion.main 
        initial={false}
        animate={{ 
          paddingTop: (view === 'scoreboard' && window.innerWidth < 1024 && isNavVisible) ? 64 : (view === 'scoreboard' && window.innerWidth < 1024 ? 2 : 0),
          paddingBottom: 0 
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className={`relative z-10 min-h-[100dvh] flex flex-col ${view === 'scoreboard' ? 'justify-end sm:justify-center sm:gap-4 lg:gap-6' : 'justify-start pt-20 lg:pt-40 pb-24'} px-4 sm:px-6 mx-auto w-full responsive-zoom`}
        style={{ maxWidth: view === 'scoreboard' ? 'var(--gameplay-width)' : 'min(90vw, 985px)' }}
      >
        <AnimatePresence mode="wait">
          {view === 'scoreboard' && (
            <motion.div
              key="scoreboard-view"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                y: (window.innerWidth < 1024 && !isNavVisible) ? "-7vh" : 0 
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex flex-col sm:flex-none w-full"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="relative pt-1 sm:pb-8 sm:py-2 flex flex-col gap-1 sm:gap-4 min-h-0 flex-1 sm:flex-none justify-end sm:justify-start pb-0"
              >
                
              {/* Game Info Header */}
              <div className="flex items-center justify-center shrink-0 mt-auto sm:mt-0">
                {(isShotClockEnabled || isMatchClockEnabled) && (
                  <div 
                    className="flex items-center justify-center bg-black/50 p-1 sm:p-2 lg:p-2 rounded-2xl border-2 transition-all duration-500 w-full max-w-md"
                    style={{ 
                      borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1`,
                      borderRadius: '1rem'
                    }}
                  >
                    <div className="flex items-center gap-4 sm:gap-8">
                      {isMatchClockEnabled && (
                        <div className="flex flex-col items-center">
                          <span className="hidden sm:block text-[10px] font-bold uppercase tracking-tighter text-slate-500 mb-1">Match Clock</span>
                          <div 
                            className={`flex items-center gap-2 text-lg sm:text-2xl font-mono font-bold transition-colors duration-500 ${matchClock <= 60 ? 'text-red-500 animate-pulse' : ''}`}
                            style={matchClock > 60 ? { color: player1.color } : {}}
                          >
                            <Timer className="w-4 h-4 sm:w-5 sm:h-5" />
                            {formatTime(matchClock)}
                          </div>
                        </div>
                      )}
                      
                      {isShotClockEnabled && (
                        <div className="flex flex-col items-center">
                          <span className="hidden sm:block text-[10px] font-bold uppercase tracking-tighter text-slate-500 mb-1">Shot Clock</span>
                          <div 
                            className={`flex items-center gap-2 text-lg sm:text-2xl font-mono font-bold transition-colors duration-500 ${shotClock <= 5 ? 'text-red-500 animate-pulse' : ''}`}
                            style={shotClock > 5 ? { color: player2.color } : {}}
                          >
                            <Timer className="w-4 h-4 sm:w-5 sm:h-5" />
                            {shotClock}s
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button 
                          onClick={isTimerRunning ? pauseTimer : startTimer}
                          className="p-1 sm:p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all duration-500 border"
                          style={{ borderColor: isTimerRunning ? player2.color : player1.color, color: isTimerRunning ? player2.color : player1.color }}
                        >
                          {isTimerRunning ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                        <button 
                          onClick={() => {
                            resetTimer();
                            if (isMatchClockEnabled && !isShotClockEnabled) resetMatchClock();
                          }}
                          className="p-1 sm:p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all duration-500 border border-slate-700"
                          style={{ color: player1.color }}
                        >
                          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Score Cards Grid & Sidebars (Grouped for perfect alignment) */}
              <div className="relative sm:flex-1 flex items-center justify-center w-full py-0 sm:py-2">
                {/* Team Names Display (Absolute to the card grid area) - Hidden on mobile portrait */}
                <div 
                  className="absolute inset-y-0 -left-[var(--sidebar-width)] hidden sm:flex items-center justify-center pointer-events-none z-0 overflow-hidden"
                  style={{ width: 'var(--sidebar-width)' }}
                >
                  <div 
                    className="text-[min(4vw,14px)] sm:text-[32px] lg:text-[48px] font-black uppercase tracking-[0.2em] vertical-text rotate-180 h-full flex items-center justify-center"
                    style={{ color: player1.color }}
                  >
                    {team1Name}
                  </div>
                </div>
                <div 
                  className="absolute inset-y-0 -right-[var(--sidebar-width)] hidden sm:flex items-center justify-center pointer-events-none z-0 overflow-hidden"
                  style={{ width: 'var(--sidebar-width)' }}
                >
                  <div 
                    className="text-[min(4vw,14px)] sm:text-[32px] lg:text-[48px] font-black uppercase tracking-[0.2em] vertical-text h-full flex items-center justify-center"
                    style={{ color: player2.color }}
                  >
                    {team2Name}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 lg:gap-5 w-full">
                  {[player1, player2].map((p, idx) => (
                      <div key={p.id} className="flex flex-col gap-1">
                        {/* Mobile Portrait Team Name Header */}
                        <div className="sm:hidden flex items-center justify-center py-1 bg-black/50 rounded-t-xl border-x-2 border-t-2" style={{ borderColor: p.color }}>
                          <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: p.color }}>
                            {idx === 0 ? team1Name : team2Name}
                          </span>
                        </div>
                        
                        <motion.div
                          onClick={() => {
                            if (!p.isTurn) {
                              setPlayer1(prev => ({ ...prev, isTurn: p.id === '1' }));
                              setPlayer2(prev => ({ ...prev, isTurn: p.id === '2' }));
                              resetTimer();
                            }
                          }}
                          className={`relative p-2 sm:p-4 lg:p-6 ${idx === 0 || idx === 1 ? 'rounded-b-3xl sm:rounded-3xl' : 'rounded-3xl'} border-2 transition-all duration-500 cursor-pointer overflow-hidden shadow-2xl flex flex-col justify-center gameplay-card sm:min-h-0 sm:max-h-none`}
                          style={{ 
                            borderColor: p.color,
                            backgroundColor: p.bgColor,
                            boxShadow: `0 0 40px -15px ${p.color}66`
                          }}
                        >
                            {/* Mobile Score Buttons - Absolute Positioned */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                incrementScore(p.id);
                              }}
                              className={`sm:hidden absolute top-2 ${idx === 0 ? 'left-2' : 'right-2'} w-12 h-12 text-slate-950 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg z-10`}
                              style={{ 
                                backgroundColor: p.color,
                                boxShadow: `0 4px 10px -2px ${p.color}66`
                              }}
                            >
                              <Plus className="w-6 h-6 font-bold" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                decrementScore(p.id);
                              }}
                              className={`sm:hidden absolute bottom-2 ${idx === 0 ? 'left-2' : 'right-2'} w-12 h-12 bg-slate-800/80 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all active:scale-95 z-10 border border-slate-700`}
                            >
                              <Minus className="w-5 h-5" />
                            </button>

                          <div className="flex flex-col items-center gap-0 sm:gap-6">
                          {isEditingNames ? (
                            <input
                              type="text"
                              value={p.name}
                              onChange={(e) => idx === 0 ? setPlayer1({...p, name: e.target.value}) : setPlayer2({...p, name: e.target.value})}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-center text-[min(4vw,1.2rem)] sm:text-[1.8rem] lg:text-[2.2rem] font-bold focus:outline-none focus:border-emerald-500 uppercase"
                              style={{ color: p.color }}
                            />
                          ) : (
                            <h2 className="text-[min(4vw,1rem)] sm:text-[2.2rem] lg:text-[min(2.8rem,6vh)] font-bold uppercase truncate w-full text-center leading-none sm:leading-normal" style={{ color: p.color }}>
                              {p.name}
                            </h2>
                          )}

                          <div className="relative group mt-[-4px] sm:mt-0">
                            <span className="text-[min(16vw,48px)] sm:text-[min(10rem,25vh)] lg:text-[min(12rem,30vh)] font-black tracking-tighter tabular-nums leading-none" style={{ color: p.color }}>
                              {p.score}
                            </span>
                          </div>

                          {/* Desktop Score Buttons */}
                          <div className="hidden sm:flex items-center gap-3 w-full max-w-[200px] sm:max-w-none">
                            <button
                              onClick={() => decrementScore(p.id)}
                              className="flex-1 h-8 sm:h-[min(4rem,10vh)] bg-slate-800 hover:bg-slate-700 rounded-2xl flex items-center justify-center transition-all active:scale-95"
                            >
                              <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                incrementScore(p.id);
                              }}
                              className="flex-[2] h-8 sm:h-[min(4rem,10vh)] text-slate-950 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg"
                              style={{ 
                                backgroundColor: p.color,
                                boxShadow: `0 10px 15px -3px ${p.color}33`
                              }}
                            >
                              <Plus className="w-5 h-5 sm:w-6 sm:h-6 font-bold" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Finish Match Button - Now inside main to scale with content and stay visible on desktop */}
            <motion.div 
              key="finish-button"
              initial={{ y: 100, opacity: 0 }}
              animate={{ 
                y: (window.innerWidth < 1024 && isNavVisible) ? 100 : 0,
                opacity: (window.innerWidth < 1024 && isNavVisible) ? 0 : 1
              }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full flex items-center justify-center shrink-0 z-50 mt-[5vh] sm:mt-6 lg:mt-8 mb-6 sm:mb-6 lg:mb-6"
            >
              <button
                onClick={finishMatch}
                className="w-full sm:max-w-md h-12 bg-black/95 hover:bg-black backdrop-blur-md rounded-2xl flex items-center justify-center gap-3 text-sm sm:text-lg font-bold transition-all shadow-2xl border-2 active:scale-95"
                style={{ borderColor: player1.color }}
              >
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <span className="leading-none uppercase tracking-wider">Finish Match</span>
              </button>
            </motion.div>
          </motion.div>
        )}

          {view === 'teams' && (
            <motion.div
              key="teams"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 pb-20"
            >
              <div 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 transition-all duration-500"
                style={{ 
                  borderBottom: '2px solid',
                  borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1`
                }}
              >
                <div className="space-y-1">
                  <h2 className="text-4xl font-black uppercase tracking-tight text-white">Team Setup</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Configure your session players</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={downloadData}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all font-bold text-sm border-2"
                    style={{ 
                      borderColor: player2.color,
                      color: player2.color,
                      backgroundColor: player2.color + '11'
                    }}
                  >
                    <Download className="w-4 h-4" style={{ color: player2.color }} />
                    Export
                  </button>
                  <button 
                    onClick={uploadData}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all font-bold text-sm border-2"
                    style={{ 
                      borderColor: player2.color,
                      color: player2.color,
                      backgroundColor: player2.color + '11'
                    }}
                  >
                    <Upload className="w-4 h-4" style={{ color: player2.color }} />
                    Import
                  </button>
                  <button 
                    onClick={() => setShowClearTeamsConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all border-2"
                    style={{ 
                      borderColor: player2.color,
                      color: player2.color,
                      backgroundColor: player2.color + '11'
                    }}
                  >
                    <Trash2 className="w-4 h-4" style={{ color: player2.color }} />
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Team 1 Setup */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Team 1 Name</label>
                      <Users className="w-4 h-4 text-slate-600" />
                    </div>
                    <input 
                      value={team1Name} 
                      onChange={(e) => updateTeamData(e.target.value.toUpperCase(), team1Players, team2Name, team2Players)}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-black border-2 rounded-2xl px-6 py-4 text-2xl font-black text-slate-100 focus:outline-none uppercase transition-all shadow-xl" 
                      style={{ borderColor: player1.color }}
                      placeholder="TEAM 1 NAME"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Team 1 Players (In Order)</label>
                    <div className="space-y-3">
                      {team1Players.map((player, idx) => (
                        <div key={idx} className="flex gap-3 group">
                          <div 
                            className="w-10 h-12 flex items-center justify-center text-xs font-black bg-black border-2 rounded-xl"
                            style={{ borderColor: player1.color + '33', color: player1.color }}
                          >
                            {idx + 1}
                          </div>
                          <input 
                            value={player}
                            autoFocus={idx === team1Players.length - 1 && player === ''}
                            onChange={(e) => {
                              const newPlayers = [...team1Players];
                              newPlayers[idx] = e.target.value.toUpperCase();
                              updateTeamData(team1Name, newPlayers, team2Name, team2Players);
                            }}
                            onFocus={(e) => e.target.select()}
                            className="flex-1 bg-black/50 border rounded-xl px-4 py-2 text-slate-100 focus:outline-none uppercase font-bold transition-all"
                            style={{ borderColor: player1.color + '22' }}
                            placeholder={`PLAYER ${idx + 1}`}
                          />
                          <button 
                            onClick={() => {
                              const newPlayers = team1Players.filter((_, i) => i !== idx);
                              updateTeamData(team1Name, newPlayers, team2Name, team2Players);
                            }}
                            className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => updateTeamData(team1Name, [...team1Players, ''], team2Name, team2Players)}
                        className="w-full py-4 border-2 border-dashed rounded-2xl text-slate-500 transition-all flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest"
                        style={{ 
                          borderColor: player1.color + '33', 
                          color: player1.color,
                          backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = player1.color + '11';
                          e.currentTarget.style.borderColor = player1.color + '66';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.borderColor = player1.color + '33';
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        Add Player
                      </button>
                    </div>
                  </div>
                </div>

                {/* Team 2 Setup */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Team 2 Name</label>
                      <Users className="w-4 h-4 text-slate-600" />
                    </div>
                    <input 
                      value={team2Name} 
                      onChange={(e) => updateTeamData(team1Name, team1Players, e.target.value.toUpperCase(), team2Players)}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-black border-2 rounded-2xl px-6 py-4 text-2xl font-black text-slate-100 focus:outline-none uppercase transition-all shadow-xl" 
                      style={{ borderColor: player2.color }}
                      placeholder="TEAM 2 NAME"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Team 2 Players (In Order)</label>
                    <div className="space-y-3">
                      {team2Players.map((player, idx) => (
                        <div key={idx} className="flex gap-3 group">
                          <div 
                            className="w-10 h-12 flex items-center justify-center text-xs font-black bg-black border-2 rounded-xl"
                            style={{ borderColor: player2.color + '33', color: player2.color }}
                          >
                            {idx + 1}
                          </div>
                          <input 
                            value={player}
                            autoFocus={idx === team2Players.length - 1 && player === ''}
                            onChange={(e) => {
                              const newPlayers = [...team2Players];
                              newPlayers[idx] = e.target.value.toUpperCase();
                              updateTeamData(team1Name, team1Players, team2Name, newPlayers);
                            }}
                            onFocus={(e) => e.target.select()}
                            className="flex-1 bg-black/50 border rounded-xl px-4 py-2 text-slate-100 focus:outline-none uppercase font-bold transition-all"
                            style={{ borderColor: player2.color + '22' }}
                            placeholder={`PLAYER ${idx + 1}`}
                          />
                          <button 
                            onClick={() => {
                              const newPlayers = team2Players.filter((_, i) => i !== idx);
                              updateTeamData(team1Name, team1Players, team2Name, newPlayers);
                            }}
                            className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => updateTeamData(team1Name, team1Players, team2Name, [...team2Players, ''])}
                        className="w-full py-4 border-2 border-dashed rounded-2xl text-slate-500 transition-all flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest"
                        style={{ 
                          borderColor: player2.color + '33', 
                          color: player2.color,
                          backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = player2.color + '11';
                          e.currentTarget.style.borderColor = player2.color + '66';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.borderColor = player2.color + '33';
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        Add Player
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Matchups Table */}
              <div className="space-y-6 pt-8 border-t-2" style={{ borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1` }}>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black uppercase tracking-tight text-white">Matchups</h3>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Session schedule and results</p>
                </div>
                <div className="bg-black border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/50 border-b border-slate-800">
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Match</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">{team1Name || 'TEAM A'}</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">VS</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">{team2Name || 'TEAM B'}</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Last Result</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Clock</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Math.max(team1Players.length, team2Players.length) === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">Add players to generate matchups.</td>
                        </tr>
                      ) : (
                        <>
                          {Array.from({ length: Math.max(team1Players.length, team2Players.length) }).map((_, idx) => {
                            const p1 = team1Players[idx];
                            const p2 = team2Players[idx];
                            
                            // Skip if both are empty (don't show "empty vs empty" rows)
                            if (!p1 && !p2) return null;

                            const p1Name = p1 || `PLAYER ${idx + 1}`;
                            const p2Name = p2 || `PLAYER ${idx + 1}`;
                            const lastMatch = getMatchResult(p1Name, p2Name);
                            
                            return (
                              <tr 
                                key={idx} 
                                onClick={() => selectTeamMatch(idx)}
                                className={`group cursor-pointer transition-colors hover:bg-emerald-500/5 ${selectedMatchIndex === idx ? 'bg-emerald-500/10' : ''}`}
                              >
                                <td className="px-6 py-4 text-xs font-black text-slate-600">#{idx + 1}</td>
                                <td className="px-6 py-4 text-slate-100 uppercase font-bold group-hover:text-emerald-400 transition-colors">
                                  {p1 || <span className="text-slate-700 italic">EMPTY</span>}
                                </td>
                                <td className="px-6 py-4 text-center text-slate-700 font-black">VS</td>
                                <td className="px-6 py-4 text-slate-100 uppercase font-bold group-hover:text-emerald-400 transition-colors">
                                  {p2 || <span className="text-slate-700 italic">EMPTY</span>}
                                </td>
                                <td className="px-6 py-4">
                                  {lastMatch ? (
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${lastMatch.winner === p1Name ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                        {lastMatch.score1} - {lastMatch.score2}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-bold uppercase">{new Date(lastMatch.date).toLocaleDateString('en-GB')}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-600 font-bold uppercase">NO DATA</span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  {lastMatch && (lastMatch.shotClockSetting || lastMatch.matchClockRemaining !== undefined) ? (
                                    <div className="flex flex-col gap-0.5">
                                      {lastMatch.shotClockSetting && <span className="text-[9px] font-bold text-slate-500">SHOT: {lastMatch.shotClockSetting}S</span>}
                                      {lastMatch.matchClockRemaining !== undefined && <span className="text-[9px] font-bold text-slate-500">MATCH: {formatTime(lastMatch.matchClockRemaining)}</span>}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-600 font-bold uppercase">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {lastMatch && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        clearMatchResult(p1Name, p2Name);
                                      }}
                                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                      title="Clear Result"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {/* Totals Row */}
                          <tr className="bg-slate-800/80 border-t-2 border-slate-700 font-black">
                            <td className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] text-emerald-500">Total Score</td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col">
                                <span className="text-2xl text-emerald-400 tabular-nums">{teamTotals.t1}</span>
                                <span className="text-[8px] text-slate-500 uppercase tracking-tighter">{team1Name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center text-slate-700 font-black">SUM</td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col">
                                <span className="text-2xl text-emerald-400 tabular-nums">{teamTotals.t2}</span>
                                <span className="text-[8px] text-slate-500 uppercase tracking-tighter">{team2Name}</span>
                              </div>
                            </td>
                            <td colSpan={3} className="px-6 py-5 bg-slate-900/50">
                              <div className="flex items-center justify-end gap-4">
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] text-slate-500 uppercase font-bold">Overall Lead</span>
                                  <span className="text-sm font-black text-slate-100">
                                    {teamTotals.t1 === teamTotals.t2 ? 'TIED' : 
                                     teamTotals.t1 > teamTotals.t2 ? `${team1Name} (+${teamTotals.t1 - teamTotals.t2})` : 
                                     `${team2Name} (+${teamTotals.t2 - teamTotals.t1})`}
                                  </span>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                  <Trophy className="w-5 h-5 text-emerald-400" />
                                </div>
                              </div>
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-12 pb-20"
            >
              <div 
                className="space-y-1 pb-8 transition-all duration-500"
                style={{ 
                  borderBottom: '2px solid',
                  borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1`
                }}
              >
                <h2 className="text-4xl font-black uppercase tracking-tight text-white">Settings</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Customize your scoring experience</p>
              </div>

              <div className="space-y-12">
                <section className="space-y-6">
                  <h3 
                    className="text-[10px] font-black uppercase tracking-widest pb-2 border-b-2"
                    style={{ borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1`, color: player1.color }}
                  >
                    Player Customization
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                    {[player1, player2].map((p, idx) => (
                      <div 
                        key={p.id} 
                        className="relative p-8 rounded-[32px] border-2 space-y-6 shadow-xl transition-all duration-500"
                        style={{ 
                          backgroundColor: p.bgColor,
                          borderColor: p.color,
                          boxShadow: `0 20px 50px -20px ${p.color}33`,
                          '--player-color': p.color 
                        } as React.CSSProperties}
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Player {idx + 1} Name</label>
                          <Palette className="w-4 h-4" style={{ color: p.color }} />
                        </div>
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => idx === 0 ? setPlayer1({...p, name: e.target.value}) : setPlayer2({...p, name: e.target.value})}
                          className="w-full bg-slate-950/30 border border-white/10 rounded-2xl px-6 py-3 text-2xl font-black focus:outline-none uppercase transition-all"
                          style={{ 
                            borderColor: 'transparent',
                            outline: 'none',
                            boxShadow: 'none'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = p.color;
                            e.target.style.boxShadow = `0 0 0 2px ${p.color}33`;
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'transparent';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        <div className="space-y-6">
                          <ColorPicker
                            label="Text & Border"
                            value={p.color}
                            onChange={(color) => idx === 0 ? setPlayer1({...p, color}) : setPlayer2({...p, color})}
                            colors={THEME_COLORS}
                            icon={<Palette className="w-4 h-4" />}
                            isOpen={activePicker === `p${idx + 1}-theme`}
                            onToggle={(isOpen) => setActivePicker(isOpen ? `p${idx + 1}-theme` : null)}
                            themeColor={p.color}
                          />

                          <ColorPicker
                            label="Card Background"
                            value={p.bgColor}
                            onChange={(color) => idx === 0 ? setPlayer1({...p, bgColor: color}) : setPlayer2({...p, bgColor: color})}
                            colors={BACKGROUND_COLORS}
                            icon={<Layout className="w-4 h-4" />}
                            isOpen={activePicker === `p${idx + 1}-bg`}
                            onToggle={(isOpen) => setActivePicker(isOpen ? `p${idx + 1}-bg` : null)}
                            themeColor={p.color}
                          />

                          <div className="relative">
                            <ColorPicker
                              label="Screen Background"
                              value={p.screenColor}
                              onChange={(color) => idx === 0 ? setPlayer1({...p, screenColor: color}) : setPlayer2({...p, screenColor: color})}
                              colors={BACKGROUND_COLORS}
                              icon={<Maximize className="w-4 h-4" />}
                              isOpen={activePicker === `p${idx + 1}-screen`}
                              onToggle={(isOpen) => setActivePicker(isOpen ? `p${idx + 1}-screen` : null)}
                              themeColor={p.color}
                            />
                            {/* Screen Color Indicator Circle - 3rem (w-12 h-12) */}
                            <div 
                              className={`absolute w-12 h-12 rounded-full shadow-2xl transition-all duration-500 z-20 top-1/2 border-2 ${idx === 0 ? 'left-0' : 'right-0'}`}
                              style={{ 
                                backgroundColor: p.screenColor,
                                borderColor: p.color,
                                transform: `translateY(-50%) ${idx === 0 ? 'translateX(calc(-1 * var(--circle-offset)))' : 'translateX(var(--circle-offset))'}`,
                              } as any}
                              title="Screen Background Color"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 
                    className="text-[10px] font-black uppercase tracking-widest pb-2 border-b-2"
                    style={{ borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1`, color: player1.color }}
                  >
                    Master Match Clock
                  </h3>
                  <div 
                    className="bg-black/80 backdrop-blur-md border-2 rounded-[32px] p-8 space-y-8 shadow-xl" 
                    style={{ borderColor: player1.color }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xl font-black text-slate-200 uppercase tracking-tight">Enable Match Clock</p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">A master countdown for the entire match.</p>
                      </div>
                      <button 
                        onClick={() => {
                          setIsMatchClockEnabled(!isMatchClockEnabled);
                          if (isMatchClockEnabled) pauseTimer();
                        }}
                        className={`w-14 h-7 rounded-full transition-colors relative`}
                        style={{ backgroundColor: isMatchClockEnabled ? player1.color : '#334155' }}
                      >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isMatchClockEnabled ? 'left-8' : 'left-1'}`} />
                      </button>
                    </div>

                    {isMatchClockEnabled && (
                      <div className="space-y-6 pt-8 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Match Duration</label>
                          <span className="text-3xl font-mono font-black" style={{ color: player1.color }}>{Math.floor(matchClockDuration / 60)}m</span>
                        </div>
                        <input 
                          type="range" 
                          min="300" 
                          max="3600" 
                          step="300"
                          value={matchClockDuration}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setMatchClockDuration(val);
                            setMatchClock(val);
                          }}
                          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                          style={{ accentColor: player1.color }}
                        />
                        <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                          <span>5m</span>
                          <span>30m</span>
                          <span>60m</span>
                        </div>
                        <button 
                          onClick={resetMatchClock}
                          className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-700"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Reset Match Clock
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 
                    className="text-[10px] font-black uppercase tracking-widest pb-2 border-b-2"
                    style={{ borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1`, color: player2.color }}
                  >
                    Shot Clock Settings
                  </h3>
                  <div 
                    className="bg-black/80 backdrop-blur-md border-2 rounded-[32px] p-8 space-y-8 shadow-xl" 
                    style={{ borderColor: player2.color }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xl font-black text-slate-200 uppercase tracking-tight">Enable Shot Clock</p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Toggle the visibility and timer on the scoreboard.</p>
                      </div>
                      <button 
                        onClick={() => {
                          setIsShotClockEnabled(!isShotClockEnabled);
                          if (isShotClockEnabled) pauseTimer();
                        }}
                        className={`w-14 h-7 rounded-full transition-colors relative`}
                        style={{ backgroundColor: isShotClockEnabled ? player2.color : '#334155' }}
                      >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isShotClockEnabled ? 'left-8' : 'left-1'}`} />
                      </button>
                    </div>

                    {isShotClockEnabled && (
                      <div className="space-y-6 pt-8 border-t-2" style={{ borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1` }}>
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Timer Duration</label>
                          <span className="text-3xl font-mono font-black" style={{ color: player2.color }}>{shotClockDuration}s</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="120" 
                          step="5"
                          value={shotClockDuration}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setShotClockDuration(val);
                            setShotClock(val);
                          }}
                          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                          style={{ accentColor: player2.color }}
                        />
                        <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                          <span>10s</span>
                          <span>60s</span>
                          <span>120s</span>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 
                    className="text-[10px] font-black uppercase tracking-widest pb-2 border-b-2"
                    style={{ borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1`, color: player1.color }}
                  >
                    System Settings
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div 
                      className="bg-black/80 backdrop-blur-md border-2 rounded-[32px] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl"
                      style={{ borderColor: player1.color }}
                    >
                      <div className="space-y-1 text-center sm:text-left">
                        <p className="text-xl font-black text-slate-200 uppercase tracking-tight">Restore Default Settings</p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Resets all color selections to default.</p>
                      </div>
                      <button 
                        onClick={() => setShowRestoreDefaultsConfirm(true)}
                        className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-700"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore Defaults
                      </button>
                    </div>
                  </div>
                </section>

                <section className="pt-12">
                  <div 
                    className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-8 space-y-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                      <span className="text-slate-500">Version</span>
                      <span className="font-mono" style={{ color: player1.color }}>1.0.0-pro</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                      <span className="text-slate-500">Developer</span>
                      <span className="font-mono" style={{ color: player2.color }}>Stealthton</span>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Modals */}
        <AnimatePresence>
          {showClearTeamsConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-black border-2 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6"
                style={{ borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1` }}
              >
                <div className="flex items-center gap-4 text-red-500">
                  <Trash2 className="w-8 h-8" />
                  <h3 className="text-xl font-bold">Clear All Team Data?</h3>
                </div>
                <p className="text-slate-400">This will permanently delete team names and all player lists. This action cannot be undone.</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowClearTeamsConfirm(false)}
                    className="flex-1 h-12 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={clearTeams}
                    className="flex-1 h-12 bg-red-500 hover:bg-red-400 text-slate-950 rounded-xl font-bold transition-all"
                  >
                    Clear All
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {showRestoreDefaultsConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-black border-2 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6"
                style={{ borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1` }}
              >
                <div className="flex items-center gap-4 text-blue-500">
                  <RotateCcw className="w-8 h-8" />
                  <h3 className="text-xl font-bold">Restore Defaults?</h3>
                </div>
                <p className="text-slate-400">This will reset all player colors to their original defaults. Your scores and history will not be affected.</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowRestoreDefaultsConfirm(false)}
                    className="flex-1 h-12 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      setPlayer1(prev => ({ ...prev, color: '#FFFFFF', bgColor: '#881337', screenColor: '#000000' }));
                      setPlayer2(prev => ({ ...prev, color: '#FFFFFF', bgColor: '#1e3a8a', screenColor: '#000000' }));
                      setShowRestoreDefaultsConfirm(false);
                    }}
                    className="flex-1 h-12 bg-blue-500 hover:bg-blue-400 text-slate-950 rounded-xl font-bold transition-all"
                  >
                    Restore
                  </button>
                </div>
              </motion.div>
            </div>
          )}
          {showClearHistoryConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-black border-2 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6"
                style={{ borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1` }}
              >
                <div className="flex items-center gap-4 text-red-500">
                  <Trash2 className="w-8 h-8" />
                  <h3 className="text-xl font-bold">Clear Match History?</h3>
                </div>
                <p className="text-slate-400">This will permanently delete all saved match results. This action cannot be undone.</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowClearHistoryConfirm(false)}
                    className="flex-1 h-12 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      clearHistory();
                      setShowClearHistoryConfirm(false);
                    }}
                    className="flex-1 h-12 bg-red-500 hover:bg-red-400 text-slate-950 rounded-xl font-bold transition-all"
                  >
                    Clear All
                  </button>
                </div>
              </motion.div>
            </div>
          )}
          {showTeamTotals && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                className="bg-black border-2 p-10 rounded-[40px] max-w-2xl w-full space-y-10 text-center"
                style={{ 
                  borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1`,
                  boxShadow: `0 0 50px ${player1.color}11`
                }}
              >
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <div className="p-4 rounded-full" style={{ backgroundColor: `${player1.color}11` }}>
                      <Trophy className="w-12 h-12" style={{ color: player1.color }} />
                    </div>
                  </div>
                  <h2 className="text-5xl font-black uppercase tracking-tighter text-white">Team Totals</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Final Session Results</p>
                </div>

                <div className="grid grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <p className="text-xl font-black uppercase tracking-tight truncate" style={{ color: player1.color }}>{team1Name}</p>
                    <p className="text-8xl font-black text-white tabular-nums">
                      {teamTotals.t1}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xl font-black uppercase tracking-tight truncate" style={{ color: player2.color }}>{team2Name}</p>
                    <p className="text-8xl font-black text-white tabular-nums">
                      {teamTotals.t2}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setShowTeamTotals(false);
                    setView('teams');
                  }}
                  className="w-full h-20 text-slate-950 rounded-3xl font-black text-2xl uppercase tracking-widest transition-all active:scale-95"
                  style={{ 
                    backgroundImage: `linear-gradient(to right, ${player1.color}, ${player2.color})`,
                    boxShadow: `0 10px 20px ${player1.color}33`
                  }}
                >
                  Close Results
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.main>

      {/* Navigation Bar Spacing for history view */}
      {view !== 'scoreboard' && <div className="h-16 lg:h-32" />}

      {/* Quick Actions Floating Bar (Mobile) */}
      <AnimatePresence>
        {view !== 'scoreboard' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/90 backdrop-blur-xl border-2 p-2 rounded-2xl shadow-2xl md:hidden z-50 bar-zoom"
            style={{ borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1` }}
          >
            <button 
              onClick={navigateToScoreboard}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === 'scoreboard' ? 'text-slate-950' : 'text-slate-400'}`}
              style={view === 'scoreboard' ? { backgroundColor: player1.color } : {}}
            >
              Score
            </button>
            <button 
              onClick={() => setView('teams')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === 'teams' ? 'text-slate-950' : 'text-slate-400'}`}
              style={view === 'teams' ? { backgroundColor: player1.color } : {}}
            >
              Teams
            </button>
            <button 
              onClick={() => setView('settings')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === 'settings' ? 'text-slate-950' : 'text-slate-400'}`}
              style={view === 'settings' ? { backgroundColor: player2.color } : {}}
            >
              Settings
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
