import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [player1, setPlayer1] = useState<Player>({ id: '1', name: 'Player 1', score: 0, isTurn: true, color: '#FFFFFF', bgColor: '#881337', screenColor: '#0f172a' });
  const [player2, setPlayer2] = useState<Player>({ id: '2', name: 'Player 2', score: 0, isTurn: false, color: '#FFFFFF', bgColor: '#1e3a8a', screenColor: '#0f172a' });
  const [team1Name, setTeam1Name] = useState<string>('TEAM 1');
  const [team2Name, setTeam2Name] = useState<string>('TEAM 2');
  const [team1Players, setTeam1Players] = useState<string[]>([]);
  const [team2Players, setTeam2Players] = useState<string[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryEntry[]>([]);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState<number | null>(null);
  const [view, setView] = useState<'scoreboard' | 'history' | 'settings' | 'teams'>('scoreboard');
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

  // --- Initialization ---
  useEffect(() => {
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

  const downloadData = () => {
    if (matchHistory.length === 0) {
      // If no history, just download team info
      const headers = ['Team', 'Player Name'];
      let csvContent = headers.join(',') + '\n';
      
      team1Players.forEach(p => csvContent += `${team1Name},${p}\n`);
      team2Players.forEach(p => csvContent += `${team2Name},${p}\n`);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `pool_teams_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pool_stats_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      {/* Split Screen Background Layer - Moved to very top and using z-[-10] */}
      <div className="fixed inset-0 z-[-10] flex overflow-hidden pointer-events-none">
        <div className="flex-1 h-full transition-colors duration-700" style={{ backgroundColor: player1.screenColor }} />
        <div className="flex-1 h-full transition-colors duration-700" style={{ backgroundColor: player2.screenColor }} />
      </div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Trophy className="w-5 h-5 text-slate-950" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            PoolPro
          </h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors hidden sm:flex"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setView('scoreboard')}
            className={`p-2 rounded-lg transition-colors ${view === 'scoreboard' ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Trophy className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setView('teams')}
            className={`p-2 rounded-lg transition-colors ${view === 'teams' ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Users className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setView('settings')}
            className={`p-2 rounded-lg transition-colors ${view === 'settings' ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="relative z-10 min-h-screen flex flex-col justify-center py-20 px-4 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {view === 'scoreboard' && (
            <motion.div
              key="scoreboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Team Names Display (Vertical, Nudged up to align with scores) */}
              <div 
                className="fixed inset-y-0 left-0 flex items-center justify-center pointer-events-none z-0 -translate-y-12"
                style={{ width: 'calc((100vw - 896px) / 2)' }}
              >
                <div 
                  className="text-[32px] sm:text-[48px] font-black uppercase tracking-[0.2em] vertical-text rotate-180 h-full flex items-center justify-center"
                  style={{ color: player1.color }}
                >
                  {team1Name}
                </div>
              </div>
              <div 
                className="fixed inset-y-0 right-0 flex items-center justify-center pointer-events-none z-0 -translate-y-12"
                style={{ width: 'calc((100vw - 896px) / 2)' }}
              >
                <div 
                  className="text-[32px] sm:text-[48px] font-black uppercase tracking-[0.2em] vertical-text h-full flex items-center justify-center"
                  style={{ color: player2.color }}
                >
                  {team2Name}
                </div>
              </div>

              {/* Game Info Header */}
              {(isShotClockEnabled || isMatchClockEnabled) && (
                <div className="flex items-center justify-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-8">
                    {isMatchClockEnabled && (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-500 mb-1">Match Clock</span>
                        <div className={`flex items-center gap-2 text-2xl font-mono font-bold ${matchClock <= 60 ? 'text-red-500 animate-pulse' : 'text-slate-100'}`}>
                          <Timer className="w-5 h-5" />
                          {formatTime(matchClock)}
                        </div>
                      </div>
                    )}
                    
                    {isShotClockEnabled && (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-500 mb-1">Shot Clock</span>
                        <div className={`flex items-center gap-2 text-2xl font-mono font-bold ${shotClock <= 5 ? 'text-red-500 animate-pulse' : 'text-slate-100'}`}>
                          <Timer className="w-5 h-5" />
                          {shotClock}s
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button 
                        onClick={isTimerRunning ? pauseTimer : startTimer}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                      >
                        {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={() => {
                          resetTimer();
                          if (isMatchClockEnabled && !isShotClockEnabled) resetMatchClock();
                        }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Score Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[player1, player2].map((p, idx) => (
                  <motion.div
                    key={p.id}
                    onClick={() => {
                      if (!p.isTurn) {
                        setPlayer1(prev => ({ ...prev, isTurn: p.id === '1' }));
                        setPlayer2(prev => ({ ...prev, isTurn: p.id === '2' }));
                        resetTimer();
                      }
                    }}
                    className="relative p-6 sm:p-8 rounded-3xl border-2 transition-all duration-500 cursor-pointer overflow-hidden shadow-2xl"
                    style={{ 
                      borderColor: p.color,
                      backgroundColor: p.bgColor,
                      boxShadow: `0 0 40px -15px ${p.color}66`
                    }}
                  >
                    {p.isTurn && (
                      <motion.div 
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1 rounded-b-xl text-[10px] font-black uppercase tracking-[0.2em] z-10"
                        style={{ backgroundColor: p.color, color: p.bgColor }}
                      >
                        Active Turn
                      </motion.div>
                    )}
                    <div className="flex flex-col items-center gap-6">
                      {isEditingNames ? (
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => idx === 0 ? setPlayer1({...p, name: e.target.value}) : setPlayer2({...p, name: e.target.value})}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-center text-[1.5rem] font-bold focus:outline-none focus:border-emerald-500 uppercase"
                          style={{ color: p.color }}
                        />
                      ) : (
                        <h2 className="text-[1.8rem] font-bold uppercase" style={{ color: p.color }}>
                          {p.name}
                        </h2>
                      )}

                      <div className="relative group">
                        <span className="text-7xl sm:text-9xl font-black tracking-tighter tabular-nums" style={{ color: p.color }}>
                          {p.score}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 w-full">
                        <button
                          onClick={() => decrementScore(p.id)}
                          className="flex-1 h-16 bg-slate-800 hover:bg-slate-700 rounded-2xl flex items-center justify-center transition-all active:scale-95"
                        >
                          <Minus className="w-6 h-6" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            incrementScore(p.id);
                          }}
                          className="flex-[2] h-16 text-slate-950 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg"
                          style={{ 
                            backgroundColor: p.color,
                            boxShadow: `0 10px 15px -3px ${p.color}33`
                          }}
                        >
                          <Plus className="w-8 h-8 font-bold" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Finish Match */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={finishMatch}
                  className="flex-1 h-20 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 rounded-2xl flex items-center justify-center gap-3 text-xl font-bold transition-all shadow-xl border border-slate-700 active:scale-95"
                >
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  Finish Match
                </button>
              </div>
            </motion.div>
          )}

          {view === 'teams' && (
            <motion.div
              key="teams"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold uppercase">Team Setup</h2>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={downloadData}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-all font-bold text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download Data
                  </button>
                  <button 
                    onClick={() => setShowClearTeamsConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All Data
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Team 1 Setup */}
                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Team 1 Name</label>
                      <Users className="w-4 h-4 text-slate-600" />
                    </div>
                    <input 
                      value={team1Name} 
                      onChange={(e) => updateTeamData(e.target.value.toUpperCase(), team1Players, team2Name, team2Players)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xl font-bold text-slate-100 focus:outline-none focus:border-emerald-500 uppercase" 
                      placeholder="TEAM 1 NAME"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Team 1 Players (In Order)</label>
                    <div className="space-y-2">
                      {team1Players.map((player, idx) => (
                        <div key={idx} className="flex gap-2">
                          <div className="w-8 h-10 flex items-center justify-center text-xs font-bold text-slate-600 bg-slate-800 rounded-lg">
                            {idx + 1}
                          </div>
                          <input 
                            value={player}
                            onChange={(e) => {
                              const newPlayers = [...team1Players];
                              newPlayers[idx] = e.target.value.toUpperCase();
                              updateTeamData(team1Name, newPlayers, team2Name, team2Players);
                            }}
                            className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 uppercase"
                            placeholder={`PLAYER ${idx + 1}`}
                          />
                          <button 
                            onClick={() => {
                              const newPlayers = team1Players.filter((_, i) => i !== idx);
                              updateTeamData(team1Name, newPlayers, team2Name, team2Players);
                            }}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => updateTeamData(team1Name, [...team1Players, ''], team2Name, team2Players)}
                        className="w-full py-3 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-xl text-slate-500 hover:text-emerald-400 transition-all flex items-center justify-center gap-2 text-sm font-bold"
                      >
                        <Plus className="w-4 h-4" />
                        Add Player to Team 1
                      </button>
                    </div>
                  </div>
                </div>

                {/* Team 2 Setup */}
                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Team 2 Name</label>
                      <Users className="w-4 h-4 text-slate-600" />
                    </div>
                    <input 
                      value={team2Name} 
                      onChange={(e) => updateTeamData(team1Name, team1Players, e.target.value.toUpperCase(), team2Players)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xl font-bold text-slate-100 focus:outline-none focus:border-emerald-500 uppercase" 
                      placeholder="TEAM 2 NAME"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Team 2 Players (In Order)</label>
                    <div className="space-y-2">
                      {team2Players.map((player, idx) => (
                        <div key={idx} className="flex gap-2">
                          <div className="w-8 h-10 flex items-center justify-center text-xs font-bold text-slate-600 bg-slate-800 rounded-lg">
                            {idx + 1}
                          </div>
                          <input 
                            value={player}
                            onChange={(e) => {
                              const newPlayers = [...team2Players];
                              newPlayers[idx] = e.target.value.toUpperCase();
                              updateTeamData(team1Name, team1Players, team2Name, newPlayers);
                            }}
                            className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 uppercase"
                            placeholder={`PLAYER ${idx + 1}`}
                          />
                          <button 
                            onClick={() => {
                              const newPlayers = team2Players.filter((_, i) => i !== idx);
                              updateTeamData(team1Name, team1Players, team2Name, newPlayers);
                            }}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => updateTeamData(team1Name, team1Players, team2Name, [...team2Players, ''])}
                        className="w-full py-3 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-xl text-slate-500 hover:text-emerald-400 transition-all flex items-center justify-center gap-2 text-sm font-bold"
                      >
                        <Plus className="w-4 h-4" />
                        Add Player to Team 2
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Matchups Table */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Matchups</h3>
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/50 border-b border-slate-800">
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
                        Array.from({ length: Math.max(team1Players.length, team2Players.length) }).map((_, idx) => {
                          const p1 = team1Players[idx];
                          const p2 = team2Players[idx];
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
                        })
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
              className="space-y-8"
            >
              <h2 className="text-3xl font-bold">Settings</h2>

              <div className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Player Customization</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[player1, player2].map((p, idx) => (
                      <div key={p.id} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase text-slate-500">Player {idx + 1} Name</label>
                          <Palette className="w-4 h-4 text-slate-600" />
                        </div>
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => idx === 0 ? setPlayer1({...p, name: e.target.value}) : setPlayer2({...p, name: e.target.value})}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xl font-bold focus:outline-none focus:border-emerald-500 uppercase"
                        />
                        <div className="space-y-4">
                          <ColorPicker
                            label="Theme Color"
                            value={p.color}
                            onChange={(color) => idx === 0 ? setPlayer1({...p, color}) : setPlayer2({...p, color})}
                            colors={THEME_COLORS}
                            icon={<Palette className="w-4 h-4" />}
                            isOpen={activePicker === `p${idx + 1}-theme`}
                            onToggle={(isOpen) => setActivePicker(isOpen ? `p${idx + 1}-theme` : null)}
                          />

                          <ColorPicker
                            label="Background Color"
                            value={p.bgColor}
                            onChange={(color) => idx === 0 ? setPlayer1({...p, bgColor: color}) : setPlayer2({...p, bgColor: color})}
                            colors={BACKGROUND_COLORS}
                            icon={<Layout className="w-4 h-4" />}
                            isOpen={activePicker === `p${idx + 1}-bg`}
                            onToggle={(isOpen) => setActivePicker(isOpen ? `p${idx + 1}-bg` : null)}
                          />

                          <ColorPicker
                            label="Screen Background"
                            value={p.screenColor}
                            onChange={(color) => idx === 0 ? setPlayer1({...p, screenColor: color}) : setPlayer2({...p, screenColor: color})}
                            colors={BACKGROUND_COLORS}
                            icon={<Maximize className="w-4 h-4" />}
                            isOpen={activePicker === `p${idx + 1}-screen`}
                            onToggle={(isOpen) => setActivePicker(isOpen ? `p${idx + 1}-screen` : null)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Master Match Clock</h3>
                  <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-200">Enable Match Clock</p>
                        <p className="text-xs text-slate-500">A master countdown for the entire match.</p>
                      </div>
                      <button 
                        onClick={() => {
                          setIsMatchClockEnabled(!isMatchClockEnabled);
                          if (isMatchClockEnabled) pauseTimer();
                        }}
                        className={`w-12 h-6 rounded-full transition-colors relative ${isMatchClockEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isMatchClockEnabled ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    {isMatchClockEnabled && (
                      <div className="space-y-4 pt-4 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-slate-400">Match Duration (minutes)</label>
                          <span className="text-xl font-mono font-bold text-emerald-400">{Math.floor(matchClockDuration / 60)}m</span>
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
                          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                          <span>5m</span>
                          <span>30m</span>
                          <span>60m</span>
                        </div>
                        <button 
                          onClick={resetMatchClock}
                          className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset Match Clock
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Shot Clock Settings</h3>
                  <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-200">Enable Shot Clock</p>
                        <p className="text-xs text-slate-500">Toggle the visibility and timer on the scoreboard.</p>
                      </div>
                      <button 
                        onClick={() => {
                          setIsShotClockEnabled(!isShotClockEnabled);
                          if (isShotClockEnabled) pauseTimer();
                        }}
                        className={`w-12 h-6 rounded-full transition-colors relative ${isShotClockEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isShotClockEnabled ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    {isShotClockEnabled && (
                      <div className="space-y-4 pt-4 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-slate-400">Timer Duration (seconds)</label>
                          <span className="text-xl font-mono font-bold text-emerald-400">{shotClockDuration}s</span>
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
                          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                          <span>10s</span>
                          <span>60s</span>
                          <span>120s</span>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Danger Zone</h3>
                  <div className="space-y-4">
                    <div className="bg-slate-900 border border-red-900/30 rounded-2xl p-6 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-200">Reset Current Game</p>
                        <p className="text-xs text-slate-500">Resets scores without saving to history.</p>
                      </div>
                      <button 
                        onClick={() => {
                          setPlayer1(prev => ({ ...prev, score: 0 }));
                          setPlayer2(prev => ({ ...prev, score: 0 }));
                          resetTimer();
                          setView('scoreboard');
                        }}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl font-bold transition-all"
                      >
                        Reset Now
                      </button>
                    </div>

                    <div className="bg-slate-900 border border-red-900/30 rounded-2xl p-6 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-200">Clear Match History</p>
                        <p className="text-xs text-slate-500">Permanently deletes all recorded match history.</p>
                      </div>
                      <button 
                        onClick={() => setShowClearHistoryConfirm(true)}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl font-bold transition-all"
                      >
                        Clear History
                      </button>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Version</span>
                      <span className="font-mono text-slate-300">1.0.0-pro</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Developer</span>
                      <span className="font-mono text-slate-300">Stealthton</span>
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6"
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
          {showClearHistoryConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6"
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                className="bg-slate-900 border-2 border-emerald-500/30 p-10 rounded-[40px] max-w-2xl w-full shadow-[0_0_50px_rgba(16,185,129,0.1)] space-y-10 text-center"
              >
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <div className="bg-emerald-500/10 p-4 rounded-full">
                      <Trophy className="w-12 h-12 text-emerald-400" />
                    </div>
                  </div>
                  <h2 className="text-5xl font-black uppercase tracking-tighter text-white">Team Totals</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Final Session Results</p>
                </div>

                <div className="grid grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <p className="text-xl font-black text-slate-400 uppercase tracking-tight truncate">{team1Name}</p>
                    <p className="text-8xl font-black text-white tabular-nums">
                      {matchHistory
                        .filter(m => m.team1 === team1Name && m.team2 === team2Name)
                        .reduce((acc, m) => acc + m.score1, 0)}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xl font-black text-slate-400 uppercase tracking-tight truncate">{team2Name}</p>
                    <p className="text-8xl font-black text-white tabular-nums">
                      {matchHistory
                        .filter(m => m.team1 === team1Name && m.team2 === team2Name)
                        .reduce((acc, m) => acc + m.score2, 0)}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowTeamTotals(false)}
                  className="w-full h-20 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-3xl font-black text-2xl uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  Close Results
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Quick Actions Floating Bar (Mobile) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-2 rounded-2xl shadow-2xl md:hidden z-50">
        <button 
          onClick={() => setView('scoreboard')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === 'scoreboard' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
        >
          Score
        </button>
        <button 
          onClick={() => setView('teams')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === 'teams' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
        >
          Teams
        </button>
        <button 
          onClick={() => setView('settings')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === 'settings' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
        >
          Settings
        </button>
      </div>
    </div>
  );
}
