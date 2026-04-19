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
  Circle,
  Palette,
  Maximize,
  Minimize,
  Layout,
  Users,
  Download,
  Upload,
  X,
  PlusCircle,
  Share2,
  Server,
  Zap,
  Clock,
  FileText,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Player, MatchHistoryEntry, MatchupSettings, FrameDetail } from './types';
import { 
  THEME_COLORS, 
  BACKGROUND_COLORS, 
  POOL_BALLS, 
  CLOTH_COLORS, 
  SPEED_CLOTH_COLORS, 
  DIAL_COLORS 
} from './constants';
import { ColorPicker } from './components/ColorPicker';

const SHOT_CLOCK_DEFAULT = 30;

export default function App() {
  // --- State ---
  const [player1, setPlayer1] = useState<Player>({ id: '1', name: '', score: 0, isTurn: true, color: '#FFFF33', bgColor: '#000000', screenColor: '#000000', bgStyle: 'default', screenStyle: 'default' });
  const [player2, setPlayer2] = useState<Player>({ id: '2', name: '', score: 0, isTurn: false, color: '#FF001C', bgColor: '#000000', screenColor: '#000000', bgStyle: 'default', screenStyle: 'default' });
  const [matchupSettings, setMatchupSettings] = useState<Record<number, MatchupSettings>>({});
  const [playerPreferences, setPlayerPreferences] = useState<Record<string, { color: string, bgColor: string, screenColor: string }>>({});
  const [team1Name, setTeam1Name] = useState<string>('');
  const [team2Name, setTeam2Name] = useState<string>('');
  const [team1Players, setTeam1Players] = useState<string[]>([]);
  const [team2Players, setTeam2Players] = useState<string[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryEntry[]>([]);
  const [currentMatchFrameDetails, setCurrentMatchFrameDetails] = useState<FrameDetail[]>([]);
  const [viewingMatchDetailsId, setViewingMatchDetailsId] = useState<string | null>(null);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState<number | null>(null);
  const [view, setView] = useState<'scoreboard' | 'history' | 'settings' | 'teams' | 'match-details'>('scoreboard');
  const frameStartTimeRef = useRef<number>(Date.now());
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const isKeyboardOpenRef = useRef(false);
  const [windowSize, setWindowSize] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768 
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Robust device detection based on User-Agent and screen width
  const deviceInfo = useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isTabletUA = ua.includes("ipad") || (ua.includes("android") && !ua.includes("mobile"));
    
    // We prioritize height for scaling tiers in landscape-intended apps.
    // Screens below 768px wide OR below 500px tall are treated as phone for compact top bars.
    const isPhone = windowSize.width < 768 || windowSize.height < 500;
    const isTablet = !isPhone && windowSize.width < 1024;
    const isDesktop = !isPhone && !isTablet;
    const isLandscape = windowSize.width > windowSize.height;
    const isShort = windowSize.height < 500;
    const scaleFactor = isDesktop ? 1.3 : 1.0;

    return { isPhone, isTablet, isDesktop, isLandscape, isShort, scaleFactor };
  }, [windowSize.width, windowSize.height]); 

  // Calculate shared font size for team names to occupy 95% of vertical space
  const sharedTeamNameFontSize = useMemo(() => {
    const topBarHeightVal = deviceInfo.isPhone ? windowSize.height * 0.16 : windowSize.height * (0.1 * deviceInfo.scaleFactor);
    const topBarHeight = (deviceInfo.isPhone && !isNavVisible) ? 0 : topBarHeightVal;
    const availableHeight = windowSize.height - topBarHeight;
    const targetHeight = availableHeight * 0.9;
    
    const getFontSize = (name: string) => {
      const len = Math.max(1, name.length);
      const scale = 0.95; // Safely fit within target height
      return (targetHeight * scale) / len;
    };

    const fs1 = getFontSize(team1Name);
    const fs2 = getFontSize(team2Name);
    const shared = Math.min(fs1, fs2);

    const sidebarWidth = deviceInfo.isPhone ? (windowSize.width * 0.12) : (windowSize.width < 1024 ? (windowSize.width * 0.08) : (windowSize.width * 0.08));
    const maxFs = sidebarWidth * (deviceInfo.isPhone ? 1.2 : 1.05);

    return `${(Math.min(shared, maxFs) / windowSize.width) * 100}vw`;
  }, [windowSize.height, windowSize.width, team1Name, team2Name, deviceInfo, isNavVisible]);

  const sharedPlayerNameFontSize = useMemo(() => {
    const sidebarWidth = deviceInfo.isPhone ? (windowSize.width * 0.12) : (windowSize.width < 1024 ? (windowSize.width * 0.08 * deviceInfo.scaleFactor) : (windowSize.width * 0.08 * deviceInfo.scaleFactor));
    const mainPadding = deviceInfo.isPhone ? (windowSize.width * 0.04) : (windowSize.width < 1024 ? (windowSize.width * 0.05 * deviceInfo.scaleFactor) : (windowSize.width * 0.04 * deviceInfo.scaleFactor));
    let availableWidth = windowSize.width - (sidebarWidth * 2) - mainPadding;
    
    if (windowSize.width >= 1024) {
      availableWidth = Math.min(windowSize.width * 0.8 * deviceInfo.scaleFactor, availableWidth);
    }

    let cardWidth;
    if (deviceInfo.isLandscape) {
      const gap = deviceInfo.isPhone ? (windowSize.width * 0.03) : (windowSize.width * 0.02);
      cardWidth = (availableWidth - gap) / 2;
    } else {
      cardWidth = availableWidth;
    }
    
    const cardPadding = deviceInfo.isPhone ? (windowSize.width * 0.04) : (windowSize.width < 1024 ? (windowSize.width * 0.03) : (windowSize.width * 0.04));
    const targetWidth = cardWidth - cardPadding;

    const getFontSize = (name: string) => {
      const len = Math.max(1, (name || "PLAYER").length);
      const scale = deviceInfo.isPhone ? 1.5 : 1.2;
      return (targetWidth * scale) / len;
    };

    const fs1 = getFontSize(player1.name);
    const fs2 = getFontSize(player2.name);
    const shared = Math.min(fs1, fs2);

    const maxFs = deviceInfo.isPhone ? (windowSize.width * 0.08) : (windowSize.width < 1024 ? (windowSize.width * 0.04) : (windowSize.width * 0.03));
    
    return `${(Math.min(shared, maxFs) / windowSize.width) * 100}vw`;
  }, [windowSize.width, player1.name, player2.name, deviceInfo]);

  const labelFontSize = useMemo(() => {
    // We want 1pt bigger than Teamname field.
    // teamEntryStyle baseFs: Phone: 4.8, Tablet: 3.2, Desktop: 1.8
    // factor is 1.3 for Desktop, 1.0 otherwise.
    const factor = deviceInfo.scaleFactor;
    // 1pt approx 0.15vh as a safety buffer.
    const offset = 0.2; 
    if (deviceInfo.isPhone) return `${(4.8 + offset) * factor}vh`;
    if (deviceInfo.isTablet) return `${(3.2 + offset) * factor}vh`;
    return `${(1.8 + offset) * factor}vh`;
  }, [deviceInfo]);

  const teamEntryStyle = useMemo(() => {
    const isMobile = deviceInfo.isPhone || deviceInfo.isTablet;
    const baseFs = deviceInfo.isPhone ? 4.8 : (deviceInfo.isTablet ? 3.2 : 1.8);
    const fs = `${baseFs * deviceInfo.scaleFactor}vh`;
    const style: React.CSSProperties = { fontSize: fs };
    
    if (isMobile) {
      const vPad = deviceInfo.isPhone ? '0.4vh' : '0.8vh';
      const hPad = deviceInfo.isPhone ? '1.5vw' : '2.5vw';
      style.paddingTop = vPad;
      style.paddingBottom = vPad;
      style.paddingLeft = hPad;
      style.paddingRight = hPad;
      style.lineHeight = '2.5';
    }
    return style;
  }, [deviceInfo]);

  const playerEntryStyle = useMemo(() => {
    const isMobile = deviceInfo.isPhone || deviceInfo.isTablet;
    const baseFs = deviceInfo.isPhone ? 4.8 : (deviceInfo.isTablet ? 3.2 : 1.8);
    const fs = `${baseFs * deviceInfo.scaleFactor}vh`;
    const style: React.CSSProperties = { fontSize: fs };
    
    if (isMobile) {
      const vPad = deviceInfo.isPhone ? '0.4vh' : '0.8vh';
      style.paddingTop = vPad;
      style.paddingBottom = vPad;
      style.paddingLeft = deviceInfo.isPhone ? '2vw' : '3vw';
      style.lineHeight = '2.5';
    }
    return style;
  }, [deviceInfo]);

  // Keyboard detection for mobile
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setIsKeyboardOpen(true);
        isKeyboardOpenRef.current = true;
        setIsNavVisible(false);
      }
    };

    const handleFocusOut = () => {
      setIsKeyboardOpen(false);
      isKeyboardOpenRef.current = false;
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // Unified Navigation Logic
  useEffect(() => {
    // Keep nav visible unless keyboard is open
    if (isKeyboardOpen) {
      if (isNavVisible) setIsNavVisible(false);
    } else {
      if (!isNavVisible) setIsNavVisible(true);
    }
  }, [isKeyboardOpen, isNavVisible]);

  const hasScrolledTeamsRef = useRef(false);
  // Auto-scroll to matchups table when navigating to teams view if players exist
  useEffect(() => {
    // Reset the scroll lock when we leave the teams view
    if (view !== 'teams') {
      hasScrolledTeamsRef.current = false;
      return;
    }

    // Attempt scroll if we are in teams view, haven't scrolled yet in this session, 
    // there is data to scroll to, and the keyboard isn't blocking us.
    if (!hasScrolledTeamsRef.current && 
        (team1Players.length > 0 || team2Players.length > 0) && 
        !isKeyboardOpen) {
      
      const scrollHandler = () => {
        // Double check keyboard state in the async handler using Ref to get latest value
        if (isKeyboardOpenRef.current) return;
        
        const table = document.getElementById('matchups-table');
        if (table) {
          const headerHeight = deviceInfo.isPhone ? 44 : (deviceInfo.isTablet ? 80 : 112);
          const elementPosition = table.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - headerHeight - 24; // 24px extra buffer for breathing room

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          
          // Mark as scrolled so we don't trigger again for this entry session
          hasScrolledTeamsRef.current = true;
        }
      };

      // Try multiple times to catch the render after animations
      const timer1 = setTimeout(scrollHandler, 100);
      const timer2 = setTimeout(scrollHandler, 400);
      const timer3 = setTimeout(scrollHandler, 800);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [view, team1Players.length, team2Players.length, isKeyboardOpen, deviceInfo]);

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
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showTeamTotals, setShowTeamTotals] = useState(false);
  const [isBreakTrackingEnabled, setIsBreakTrackingEnabled] = useState(false);
  const [currentBreakPlayerId, setCurrentBreakPlayerId] = useState<'1' | '2'>('1');
  const [showRestoreDefaultsConfirm, setShowRestoreDefaultsConfirm] = useState(false);
  const [exportMethod, setExportMethod] = useState<'download' | 'share' | 'server'>('download');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportEmail, setExportEmail] = useState('');
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [apiConfig, setApiConfig] = useState({ url: '', key: '' });
  const [isApiLocked, setIsApiLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [isApiSending, setIsApiSending] = useState(false);
  const [apiTestStatus, setApiTestStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });
  const [isLoaded, setIsLoaded] = useState(false);
  const [showDeviceTime, setShowDeviceTime] = useState(true);
  const [deviceTimePosition, setDeviceTimePosition] = useState<{ x: number, y: number } | null>(null);
  const [matchClockPosition, setMatchClockPosition] = useState<{ x: number, y: number } | null>(null);
  const [shotClockPosition, setShotClockPosition] = useState<{ x: number, y: number } | null>(null);
  const [finishButtonPosition, setFinishButtonPosition] = useState<{ x: number, y: number } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const clockRef = useRef<HTMLDivElement>(null);
  const matchClockRef = useRef<HTMLDivElement>(null);
  const shotClockRef = useRef<HTMLDivElement>(null);
  const finishButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
        const settings = matchupSettings[i];
        const match = getMatchResult(p1Name, p2Name);
        
        let m1 = settings?.score1 ?? 0;
        let m2 = settings?.score2 ?? 0;
        
        if (m1 === 0 && m2 === 0 && match) {
          if (match.player1 === p1Name) {
            m1 = match.score1;
            m2 = match.score2;
          } else {
            m1 = match.score2;
            m2 = match.score1;
          }
        }
        
        t1 += m1;
        t2 += m2;
      }
    }
    return { t1, t2 };
  }, [team1Players, team2Players, matchHistory, selectedMatchIndex, player1.score, player2.score, matchupSettings]);

  // --- Initialization ---
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('pool_app_state');
      const state = savedState ? JSON.parse(savedState) : {};
      
      // Helper to get legacy or state value
      const getVal = (key: string, stateVal: any, legacyKey: string) => {
        return stateVal !== undefined ? stateVal : (localStorage.getItem(legacyKey) || undefined);
      };

      // Load Team Data
      const t1Name = getVal('team1Name', state.teamData?.team1Name, 'pool_team1_name');
      const t2Name = getVal('team2Name', state.teamData?.team2Name, 'pool_team2_name');
      if (t1Name !== undefined) setTeam1Name(t1Name);
      if (t2Name !== undefined) setTeam2Name(t2Name);

      const t1Players = state.teamData?.team1Players || JSON.parse(localStorage.getItem('pool_team1_players') || 'null');
      const t2Players = state.teamData?.team2Players || JSON.parse(localStorage.getItem('pool_team2_players') || 'null');
      if (t1Players) setTeam1Players(t1Players);
      if (t2Players) setTeam2Players(t2Players);

      // Load Game Data
      const history = state.gameData?.matchHistory || JSON.parse(localStorage.getItem('pool_match_history') || 'null');
      if (history) setMatchHistory(history);
      
      const selIndex = state.gameData?.selectedMatchIndex !== undefined ? state.gameData.selectedMatchIndex : null;
      if (selIndex !== null) setSelectedMatchIndex(selIndex);
      
      if (state.gameData?.shotClock !== undefined) setShotClock(state.gameData.shotClock);
      if (state.gameData?.matchClock !== undefined) setMatchClock(state.gameData.matchClock);

      // Prepare Player Objects
      let p1 = { ...player1 };
      let p2 = { ...player2 };

      // Load Preferences first
      if (state.userPreferences) {
        if (state.userPreferences.shotClockDuration !== undefined) setShotClockDuration(state.userPreferences.shotClockDuration);
        if (state.userPreferences.isShotClockEnabled !== undefined) setIsShotClockEnabled(state.userPreferences.isShotClockEnabled);
        if (state.userPreferences.matchClockDuration !== undefined) setMatchClockDuration(state.userPreferences.matchClockDuration);
        if (state.userPreferences.isMatchClockEnabled !== undefined) setIsMatchClockEnabled(state.userPreferences.isMatchClockEnabled);
        if (state.userPreferences.isBreakTrackingEnabled !== undefined) setIsBreakTrackingEnabled(state.userPreferences.isBreakTrackingEnabled);
        if (state.userPreferences.currentBreakPlayerId !== undefined) setCurrentBreakPlayerId(state.userPreferences.currentBreakPlayerId);
        
        if (state.userPreferences.player1) {
          p1 = { 
            ...p1, 
            ...state.userPreferences.player1,
            color: state.userPreferences.player1.borderColor || state.userPreferences.player1.color || p1.color
          };
        }
        if (state.userPreferences.player2) {
          p2 = { 
            ...p2, 
            ...state.userPreferences.player2,
            color: state.userPreferences.player2.borderColor || state.userPreferences.player2.color || p2.color
          };
        }
      } else {
        // Legacy Player Settings
        const p1Legacy = JSON.parse(localStorage.getItem('pool_player1_settings') || 'null');
        const p2Legacy = JSON.parse(localStorage.getItem('pool_player2_settings') || 'null');
        if (p1Legacy) p1 = { ...p1, ...p1Legacy };
        if (p2Legacy) p2 = { ...p2, ...p2Legacy };
      }

      // Add scores from gameData
      if (state.gameData?.player1Score !== undefined) p1.score = state.gameData.player1Score;
      if (state.gameData?.player2Score !== undefined) p2.score = state.gameData.player2Score;

      // Update state once
      setPlayer1(p1);
      setPlayer2(p2);

      // Load Other Data
      if (state.matchupSettings) setMatchupSettings(state.matchupSettings);
      if (state.playerPreferences) setPlayerPreferences(state.playerPreferences);
      if (state.apiConfig) setApiConfig(state.apiConfig);
      
      if (state.userPreferences?.view !== undefined) setView(state.userPreferences.view);
      if (state.userPreferences?.isNavVisible !== undefined) setIsNavVisible(state.userPreferences.isNavVisible);
      if (state.userPreferences?.showDeviceTime !== undefined) setShowDeviceTime(state.userPreferences.showDeviceTime);
      if (state.userPreferences?.deviceTimePosition !== undefined) setDeviceTimePosition(state.userPreferences.deviceTimePosition);
      if (state.userPreferences?.matchClockPosition !== undefined) setMatchClockPosition(state.userPreferences.matchClockPosition);
      if (state.userPreferences?.shotClockPosition !== undefined) setShotClockPosition(state.userPreferences.shotClockPosition);
      if (state.userPreferences?.finishButtonPosition !== undefined) setFinishButtonPosition(state.userPreferences.finishButtonPosition);

      // Finalize loading after state updates are scheduled
      setTimeout(() => setIsLoaded(true), 10);
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      setIsLoaded(true);
    }
  }, []);

  // --- Persistence (Single JSON Source) ---
  const saveState = useCallback(() => {
    if (!isLoaded) return;

    const stateToSave = {
      teamData: { team1Name, team2Name, team1Players, team2Players },
      gameData: { 
        matchHistory, 
        player1Score: player1.score, 
        player2Score: player2.score, 
        selectedMatchIndex, 
        shotClock, 
        matchClock 
      },
      userPreferences: {
        player1: { 
          name: player1.name, 
          borderColor: player1.color,
          bgColor: player1.bgColor,
          screenColor: player1.screenColor
        },
        player2: { 
          name: player2.name, 
          borderColor: player2.color,
          bgColor: player2.bgColor,
          screenColor: player2.screenColor
        },
        shotClockDuration,
        isShotClockEnabled,
        matchClockDuration,
        isMatchClockEnabled,
        isBreakTrackingEnabled,
        currentBreakPlayerId,
        view,
        isNavVisible,
        showDeviceTime,
        deviceTimePosition,
        matchClockPosition,
        shotClockPosition,
        finishButtonPosition
      },
      matchupSettings,
      playerPreferences,
      apiConfig
    };
    localStorage.setItem('pool_app_state', JSON.stringify(stateToSave));
  }, [
    isLoaded,
    team1Name, team2Name, team1Players, team2Players,
    matchHistory, player1, player2, selectedMatchIndex, shotClock, matchClock,
    shotClockDuration, isShotClockEnabled, matchClockDuration, isMatchClockEnabled,
    isBreakTrackingEnabled, currentBreakPlayerId,
    view, isNavVisible,
    showDeviceTime, deviceTimePosition, matchClockPosition, shotClockPosition, finishButtonPosition,
    matchupSettings, playerPreferences, apiConfig
  ]);

  useEffect(() => {
    saveState();
  }, [saveState]);

  // Window-level safety save
  useEffect(() => {
    const handleUnload = () => saveState();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [saveState]);

  // Sync current player preferences when they change
  useEffect(() => {
    if (selectedMatchIndex !== null) {
      setMatchupSettings(prev => ({
        ...prev,
        [selectedMatchIndex]: {
          player1: { color: player1.color, bgColor: player1.bgColor, screenColor: player1.screenColor },
          player2: { color: player2.color, bgColor: player2.bgColor, screenColor: player2.screenColor },
          score1: player1.score,
          score2: player2.score
        }
      }));
    }

    // Always sync player colors to playerPreferences if they have names
    if (player1.name) {
      setPlayerPreferences(prev => ({
        ...prev,
        [player1.name]: { color: player1.color, bgColor: player1.bgColor, screenColor: player1.screenColor }
      }));
    }
    if (player2.name) {
      setPlayerPreferences(prev => ({
        ...prev,
        [player2.name]: { color: player2.color, bgColor: player2.bgColor, screenColor: player2.screenColor }
      }));
    }
  }, [
    selectedMatchIndex, 
    player1.name, player1.score, player1.color, player1.bgColor, player1.screenColor,
    player2.name, player2.score, player2.color, player2.bgColor, player2.screenColor
  ]);

  // Load player preferences when names change (e.g. typed in scoreboard)
  useEffect(() => {
    if (player1.name && playerPreferences[player1.name]) {
      const pref = playerPreferences[player1.name];
      setPlayer1(prev => ({
        ...prev,
        color: pref.color,
        bgColor: pref.bgColor,
        screenColor: pref.screenColor
      }));
    }
  }, [player1.name]);

  useEffect(() => {
    if (player2.name && playerPreferences[player2.name]) {
      const pref = playerPreferences[player2.name];
      setPlayer2(prev => ({
        ...prev,
        color: pref.color,
        bgColor: pref.bgColor,
        screenColor: pref.screenColor
      }));
    }
  }, [player2.name]);

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
    const now = Date.now();
    const duration = Math.round((now - frameStartTimeRef.current) / 1000);
    
    const nextScore1 = playerId === '1' ? player1.score + 1 : player1.score;
    const nextScore2 = playerId === '2' ? player2.score + 1 : player2.score;
    
    const breakerId = currentBreakPlayerId;
    const breakerName = breakerId === '1' ? player1.name : player2.name;
    
    const frameDetail: FrameDetail = {
      frameNumber: (player1.score + player2.score) + 1,
      timestamp: new Date().toISOString(),
      score1: nextScore1,
      score2: nextScore2,
      breakerId,
      breakerName: breakerName || (breakerId === '1' ? 'PLAYER 1' : 'PLAYER 2'),
      winnerId: playerId,
      winnerName: playerId === '1' ? player1.name : player2.name,
      duration
    };
    
    setCurrentMatchFrameDetails(prev => [...prev, frameDetail]);
    frameStartTimeRef.current = now;

    if (playerId === '1') {
      setPlayer1(prev => ({ ...prev, score: prev.score + 1 }));
    } else {
      setPlayer2(prev => ({ ...prev, score: prev.score + 1 }));
    }
    
    // Swap break indicator if tracking is enabled
    if (isBreakTrackingEnabled) {
      setCurrentBreakPlayerId(prev => prev === '1' ? '2' : '1');
    }
    
    resetTimer();
  };

  const decrementScore = (playerId: string) => {
    // Undo the last frame detail if it matches the player
    setCurrentMatchFrameDetails(prev => {
      if (prev.length === 0) return prev;
      const lastFrame = prev[prev.length - 1];
      if (lastFrame.winnerId === playerId) {
        return prev.slice(0, -1);
      }
      return prev;
    });

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
      matchClockRemaining: isMatchClockEnabled ? matchClock : undefined,
      frameDetails: currentMatchFrameDetails
    };

    const updatedHistory = [newEntry, ...matchHistory];
    setMatchHistory(updatedHistory);
    setCurrentMatchFrameDetails([]);
    frameStartTimeRef.current = Date.now();
    
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

  const clearMatchResult = (p1: string, p2: string, index?: number) => {
    // 1. Clear from history
    const updatedHistory = matchHistory.filter(m => 
      !((m.player1 === p1 && m.player2 === p2) || (m.player1 === p2 && m.player2 === p1))
    );
    setMatchHistory(updatedHistory);

    // 2. Reset live matchup settings if index is provided
    if (index !== undefined) {
      setMatchupSettings(prev => {
        const next = { ...prev };
        if (next[index]) {
          next[index] = {
            ...next[index],
            score1: 0,
            score2: 0
          };
        }
        return next;
      });
      
      // 3. If it's the active match, reset the live players' scores
      if (selectedMatchIndex === index) {
        setPlayer1(prev => ({ ...prev, score: 0 }));
        setPlayer2(prev => ({ ...prev, score: 0 }));
      }
    }
  };

  const selectTeamMatch = (index: number) => {
    const p1Name = team1Players[index] || `PLAYER ${index + 1}`;
    const p2Name = team2Players[index] || `PLAYER ${index + 1}`;
    
    // Load individual player preferences if they exist
    const p1Pref = playerPreferences[p1Name];
    const p2Pref = playerPreferences[p2Name];
    
    // Load matchup-specific settings (scores, colors)
    const settings = matchupSettings[index];

    // Load existing scores - prefer live matchups setting if available
    const existingResult = getMatchResult(p1Name, p2Name);
    let p1Score = settings?.score1 !== undefined ? settings.score1 : 0;
    let p2Score = settings?.score2 !== undefined ? settings.score2 : 0;

    if (p1Score === 0 && p2Score === 0 && existingResult) {
      if (existingResult.player1 === p1Name) {
        p1Score = existingResult.score1;
        p2Score = existingResult.score2;
      } else {
        p1Score = existingResult.score2;
        p2Score = existingResult.score1;
      }
    }
    
    setPlayer1(prev => ({ 
      ...prev, 
      name: p1Name, 
      score: p1Score,
      color: p1Pref?.color || (settings?.player1.color) || '#FFFF33',
      bgColor: p1Pref?.bgColor || (settings?.player1.bgColor) || '#000000',
      screenColor: p1Pref?.screenColor || (settings?.player1.screenColor) || '#000000'
    }));
    
    setPlayer2(prev => ({ 
      ...prev, 
      name: p2Name, 
      score: p2Score,
      color: p2Pref?.color || (settings?.player2.color) || '#FF001C',
      bgColor: p2Pref?.bgColor || (settings?.player2.bgColor) || '#000000',
      screenColor: p2Pref?.screenColor || (settings?.player2.screenColor) || '#000000'
    }));
    
    setSelectedMatchIndex(index);
    setView('scoreboard');
    resetTimer();
    resetMatchClock();
  };

  const viewMatchDetails = (matchId: string) => {
    setViewingMatchDetailsId(matchId);
    setView('match-details');
  };

  const navigateToScoreboard = () => {
    const maxMatches = Math.max(team1Players.length, team2Players.length);
    
    // If we're already on scoreboard OR we have a match selected, just stay/go to it
    if (selectedMatchIndex !== null) {
      setView('scoreboard');
      return;
    }

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
    // Clear Team Data
    setTeam1Name('');
    setTeam2Name('');
    setTeam1Players([]);
    setTeam2Players([]);
    
    // Clear Game Data
    setPlayer1(prev => ({ ...prev, score: 0 }));
    setPlayer2(prev => ({ ...prev, score: 0 }));
    setMatchHistory([]);
    setMatchupSettings({});
    setSelectedMatchIndex(null);
    setShotClock(shotClockDuration);
    setMatchClock(matchClockDuration);
    
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
  };

  const parseTime = (timeStr: string) => {
    if (!timeStr || timeStr === 'OFF') return undefined;
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return parseInt(timeStr);
  };

  const formatDateUK = (date: Date, includeTime = false) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    const dateStr = `${d}.${m}.${y}`;
    if (includeTime) {
      const h = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      const s = String(date.getSeconds()).padStart(2, '0');
      return `${dateStr}, ${h}:${min}:${s}`;
    }
    return dateStr;
  };

  const parseUKDate = (str: string) => {
    if (!str || typeof str !== 'string') return null;
    // Handle DD.MM.YYYY, HH:MM:SS or DD/MM/YYYY, HH:MM:SS
    const parts = str.split(/[,\s]+/);
    const dateParts = parts[0].split(/[./-]/);
    if (dateParts.length === 3) {
      const d = parseInt(dateParts[0]);
      const m = parseInt(dateParts[1]) - 1;
      const y = parseInt(dateParts[2]);
      let h = 0, min = 0, s = 0;
      if (parts[1]) {
        const timeParts = parts[1].split(':');
        h = parseInt(timeParts[0]) || 0;
        min = parseInt(timeParts[1]) || 0;
        s = parseInt(timeParts[2]) || 0;
      }
      const date = new Date(y, m, d, h, min, s);
      if (!isNaN(date.getTime())) return date.toISOString();
    }
    return null;
  };

  const generateCSV = () => {
    let csvContent = "SECTION: TEAM SETUP\n";
    csvContent += "Team,Player Name,Highlight Color\n";
    
    team1Players.forEach(p => {
      const pref = playerPreferences[p];
      csvContent += `"${team1Name}","${p}","${pref?.color || '#FFFF33'}"\n`;
    });
    team2Players.forEach(p => {
      const pref = playerPreferences[p];
      csvContent += `"${team2Name}","${p}","${pref?.color || '#FF001C'}"\n`;
    });

    csvContent += "\nSECTION: MATCH HISTORY\n";
    csvContent += "Date,Team 1,Player 1,Score 1,Team 2,Player 2,Score 2,Winner,Shot Clock Setting,Match Clock Remaining\n";
    matchHistory.forEach(entry => {
      const formattedDate = formatDateUK(new Date(entry.date), true);

      const row = [
        formattedDate,
        entry.team1 || team1Name,
        entry.player1,
        entry.score1,
        entry.team2 || team2Name,
        entry.player2,
        entry.score2,
        entry.winner,
        entry.shotClockSetting ? `${entry.shotClockSetting}s` : 'OFF',
        entry.matchClockRemaining !== undefined && entry.matchClockRemaining !== null ? formatTime(entry.matchClockRemaining) : 'OFF'
      ];
      csvContent += row.map(val => `"${val}"`).join(',') + '\n';
    });

    csvContent += "\nSECTION: TEAM TOTALS\n";
    csvContent += "Team,Total Score\n";
    csvContent += `"${team1Name}","${teamTotals.t1}"\n`;
    csvContent += `"${team2Name}","${teamTotals.t2}"\n`;

    csvContent += "\nSECTION: SETTINGS\n";
    csvContent += "Setting,Value\n";
    csvContent += `Shot Clock Enabled,"${isShotClockEnabled}"\n`;
    csvContent += `Shot Clock Duration,"${shotClockDuration}s"\n`;
    csvContent += `Match Clock Enabled,"${isMatchClockEnabled}"\n`;
    csvContent += `Match Clock Duration,"${formatTime(matchClockDuration)}"\n`;
    csvContent += `Player 1 Highlight Color,"${player1.color}"\n`;
    csvContent += `Player 2 Highlight Color,"${player2.color}"\n`;
    csvContent += `Selected Match Index,"${selectedMatchIndex}"\n`;
    csvContent += `Show Device Time,"${showDeviceTime}"\n`;
    if (deviceTimePosition) {
      csvContent += `Device Time Position X,"${deviceTimePosition.x}"\n`;
      csvContent += `Device Time Position Y,"${deviceTimePosition.y}"\n`;
    }
    if (matchClockPosition) {
      csvContent += `Match Clock Position X,"${matchClockPosition.x}"\n`;
      csvContent += `Match Clock Position Y,"${matchClockPosition.y}"\n`;
    }
    if (shotClockPosition) {
      csvContent += `Shot Clock Position X,"${shotClockPosition.x}"\n`;
      csvContent += `Shot Clock Position Y,"${shotClockPosition.y}"\n`;
    }
    if (finishButtonPosition) {
      csvContent += `Finish Button Position X,"${finishButtonPosition.x}"\n`;
      csvContent += `Finish Button Position Y,"${finishButtonPosition.y}"\n`;
    }

    csvContent += "\nSECTION: PLAYER PREFERENCES\n";
    csvContent += "Player Name,Highlight Color\n";
    // Include current active player names if they have colors
    csvContent += `"Player 1","${player1.color}"\n`;
    csvContent += `"Player 2","${player2.color}"\n`;
    
    Object.entries(playerPreferences).forEach(([name, pref]: [string, any]) => {
      csvContent += `"${name}","${pref.color}"\n`;
    });

    return csvContent;
  };

  const generateJSON = () => {
    const state = {
      settings: {
        player1: {
          id: player1.id,
          name: player1.name,
          score: player1.score,
          isTurn: player1.isTurn,
          highlightColor: player1.color
        },
        player2: {
          id: player2.id,
          name: player2.name,
          score: player2.score,
          isTurn: player2.isTurn,
          highlightColor: player2.color
        },
        shotClockDuration,
        isShotClockEnabled,
        matchClockDuration,
        isMatchClockEnabled
      },
      teams: {
        team1Name,
        team2Name,
        team1Players,
        team2Players,
        selectedMatchIndex,
        totals: teamTotals
      },
      playerPreferences: Object.entries(playerPreferences).reduce((acc, [name, pref]: [string, any]) => {
        acc[name] = pref.color;
        return acc;
      }, {} as Record<string, string>),
      history: matchHistory.map(entry => ({
        ...entry,
        date: formatDateUK(new Date(entry.date), true)
      })),
      lastUpdated: formatDateUK(new Date(), true)
    };
    return JSON.stringify(state, null, 2);
  };

  const downloadData = (format: 'csv' | 'json' = 'csv') => {
    const now = new Date();
    const ukDate = formatDateUK(now);
    const extension = format === 'json' ? 'json' : 'csv';
    const fileName = `${team1Name.replace(/\s+/g, '_')}_V_${team2Name.replace(/\s+/g, '_')}_${ukDate}.${extension}`;

    let content: string | Blob;
    if (format === 'json') {
      content = generateJSON();
    } else {
      content = generateCSV();
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shareData = async (format: 'csv' | 'json' = 'csv') => {
    const now = new Date();
    const ukDate = formatDateUK(now);
    const extension = format === 'json' ? 'json' : 'csv';
    const fileName = `${team1Name.replace(/\s+/g, '_')}_V_${team2Name.replace(/\s+/g, '_')}_${ukDate}.${extension}`;

    let content: string;
    if (format === 'json') {
      content = generateJSON();
    } else {
      content = generateCSV();
    }

    const file = new File([content], fileName, { type: format === 'json' ? 'application/json' : 'text/csv' });

    if (navigator.share) {
      try {
        await navigator.share({
          files: [file],
          title: 'Pool Tournament Data',
          text: `Tournament data for ${team1Name} vs ${team2Name}`
        });
      } catch (err) {
        console.error('Error sharing:', err);
        if ((err as Error).name !== 'AbortError') {
          // Fallback to download if share fails (common in some browsers/contexts)
          downloadData(format);
        }
      }
    } else {
      // Fallback to download if navigator.share is not supported (e.g. Firefox)
      downloadData(format);
    }
  };

  const handleExportAction = async () => {
    if (exportMethod === 'download') {
      downloadData(exportFormat);
    } else if (exportMethod === 'share') {
      shareData(exportFormat);
    } else if (exportMethod === 'server') {
      if (!apiConfig.url) {
        alert('API URL not configured. Please set it in Settings.');
        return;
      }
      
      setIsApiSending(true);
      try {
        const body = generateJSON();
        
        console.log('--- API POST REQUEST START ---');
        console.log('URL:', apiConfig.url);
        console.log('Headers:', {
          'Content-Type': 'application/json',
          'x-api-key': apiConfig.key.substring(0, 4) + '...' // Log partial key for safety
        });
        console.log('Payload:', JSON.parse(body));
        
        const response = await fetch(apiConfig.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiConfig.key
          },
          body
        });

        console.log('Response Status:', response.status);
        console.log('--- API POST REQUEST END ---');

        if (response.ok) {
          alert('Data sent to server successfully!');
        } else {
          throw new Error(`Server responded with ${response.status}`);
        }
      } catch (err) {
        console.error('API Error:', err);
        alert('Failed to send data to server. Check console for details.');
      } finally {
        setIsApiSending(false);
      }
    }
    setShowExportMenu(false);
  };

  const uploadData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (!content) return;

        try {
          // Check if it's JSON
          if (file.name.endsWith('.json')) {
            const state = JSON.parse(content) as any;
            
            // Support new structure
            if (state.settings) {
              setShotClockDuration(state.settings.shotClockDuration || SHOT_CLOCK_DEFAULT);
              setIsShotClockEnabled(!!state.settings.isShotClockEnabled);
              setMatchClockDuration(state.settings.matchClockDuration || 600);
              setIsMatchClockEnabled(!!state.settings.isMatchClockEnabled);
              
              if (state.settings.player1) {
                setPlayer1(prev => ({ 
                  ...prev, 
                  name: state.settings.player1.name || prev.name,
                  score: state.settings.player1.score ?? prev.score,
                  isTurn: state.settings.player1.isTurn ?? prev.isTurn,
                  color: state.settings.player1.highlightColor || prev.color 
                }));
              }
              if (state.settings.player2) {
                setPlayer2(prev => ({ 
                  ...prev, 
                  name: state.settings.player2.name || prev.name,
                  score: state.settings.player2.score ?? prev.score,
                  isTurn: state.settings.player2.isTurn ?? prev.isTurn,
                  color: state.settings.player2.highlightColor || prev.color 
                }));
              }
            }

            if (state.teams) {
              setTeam1Name(state.teams.team1Name || '');
              setTeam2Name(state.teams.team2Name || '');
              setTeam1Players(state.teams.team1Players || []);
              setTeam2Players(state.teams.team2Players || []);
              setSelectedMatchIndex(state.teams.selectedMatchIndex ?? 0);
            }

            if (state.history) {
              const importedHistory = (state.history || []).map((entry: any) => {
                if (typeof entry.date === 'string' && (entry.date.includes('.') || entry.date.includes('/'))) {
                  const parsed = parseUKDate(entry.date);
                  if (parsed) return { ...entry, date: parsed };
                }
                return entry;
              });
              setMatchHistory(importedHistory);
            }

            if (state.playerPreferences) {
              const mappedPrefs: Record<string, { color: string, bgColor: string, screenColor: string }> = {};
              Object.entries(state.playerPreferences).forEach(([name, pref]: [string, any]) => {
                // Handle both new (string) and old ({borderColor}) formats
                const color = typeof pref === 'string' ? pref : (pref.borderColor || '#FFFF33');
                mappedPrefs[name] = {
                  color: color,
                  bgColor: '#000000',
                  screenColor: '#000000'
                };
              });
              setPlayerPreferences(mappedPrefs);
            }

            // Legacy support
            if (state.teamData) {
              setTeam1Name(state.teamData.team1Name || '');
              setTeam2Name(state.teamData.team2Name || '');
              setTeam1Players(state.teamData.team1Players || []);
              setTeam2Players(state.teamData.team2Players || []);
            }
            if (state.gameData) {
              setMatchHistory(state.gameData.matchHistory || []);
              setSelectedMatchIndex(state.gameData.selectedMatchIndex);
              setShotClock(state.gameData.shotClock ?? SHOT_CLOCK_DEFAULT);
              setMatchClock(state.gameData.matchClock ?? 600);
              setPlayer1(prev => ({ ...prev, score: state.gameData.player1Score || 0 }));
              setPlayer2(prev => ({ ...prev, score: state.gameData.player2Score || 0 }));
            }
            if (state.userPreferences) {
              setShotClockDuration(state.userPreferences.shotClockDuration || SHOT_CLOCK_DEFAULT);
              setIsShotClockEnabled(!!state.userPreferences.isShotClockEnabled);
              setMatchClockDuration(state.userPreferences.matchClockDuration || 600);
              setIsMatchClockEnabled(!!state.userPreferences.isMatchClockEnabled);
              if (state.userPreferences.showDeviceTime !== undefined) setShowDeviceTime(state.userPreferences.showDeviceTime);
              if (state.userPreferences.deviceTimePosition !== undefined) setDeviceTimePosition(state.userPreferences.deviceTimePosition);
              if (state.userPreferences.matchClockPosition !== undefined) setMatchClockPosition(state.userPreferences.matchClockPosition);
              if (state.userPreferences.shotClockPosition !== undefined) setShotClockPosition(state.userPreferences.shotClockPosition);
              if (state.userPreferences.finishButtonPosition !== undefined) setFinishButtonPosition(state.userPreferences.finishButtonPosition);
              
              if (state.userPreferences.player1) {
                setPlayer1(prev => ({ 
                  ...prev, 
                  name: state.userPreferences.player1.name || prev.name,
                  color: state.userPreferences.player1.borderColor || prev.color 
                }));
              }
              if (state.userPreferences.player2) {
                setPlayer2(prev => ({ 
                  ...prev, 
                  name: state.userPreferences.player2.name || prev.name,
                  color: state.userPreferences.player2.borderColor || prev.color 
                }));
              }
            }
            if (state.matchupSettings) setMatchupSettings(state.matchupSettings);
            if (state.apiConfig) setApiConfig(state.apiConfig);
            
            alert('Tournament data loaded successfully!');
            return;
          }

          // Fallback to legacy CSV parsing
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

          // Check if it's the new multi-section format
          if (lines[0].startsWith('SECTION:')) {
            let currentSection = '';
            let t1Players: string[] = [];
            let t2Players: string[] = [];
            let t1Name = '';
            let t2Name = '';
            let importedHistory: MatchHistoryEntry[] = [];
            let importedPlayerPreferences: Record<string, { color: string, bgColor: string, screenColor: string }> = { ...playerPreferences };

            lines.forEach(line => {
              if (line.startsWith('SECTION:')) {
                currentSection = line.replace('SECTION:', '').trim();
                return;
              }
              if (!line || line.trim() === '') return;

              const values = parseCSVLine(line);
              
              if (currentSection === 'TEAM SETUP') {
                if (values[0] === 'Team') return;
                const team = values[0];
                const player = values[1];
                const color = values[2];
                if (team && player) {
                  if (!t1Name) t1Name = team;
                  if (team === t1Name) {
                    if (!t1Players.includes(player)) t1Players.push(player);
                  } else {
                    if (!t2Name) t2Name = team;
                    if (!t2Players.includes(player)) t2Players.push(player);
                  }
                  if (color) {
                    importedPlayerPreferences[player] = { color, bgColor: '#000000', screenColor: '#000000' };
                  }
                }
              } else if (currentSection === 'MATCH HISTORY') {
                if (values[0] === 'Date') return;
                const parsedDate = parseUKDate(values[0]);
                importedHistory.push({
                  id: `imported-${Date.now()}-${Math.random()}`,
                  date: parsedDate || new Date(values[0]).toISOString(),
                  team1: values[1],
                  player1: values[2],
                  score1: parseInt(values[3]) || 0,
                  team2: values[4],
                  player2: values[5],
                  score2: parseInt(values[6]) || 0,
                  winner: values[7],
                  shotClockSetting: values[8] !== 'OFF' ? parseInt(values[8].replace('s', '')) : undefined,
                  matchClockRemaining: values[9] !== 'OFF' ? parseTime(values[9]) : undefined
                });
              } else if (currentSection === 'SETTINGS') {
                if (values[0] === 'Setting') return;
                const key = values[0];
                const val = values[1];
                if (key === 'Shot Clock Enabled') setIsShotClockEnabled(val === 'true');
                if (key === 'Shot Clock Duration') setShotClockDuration(parseInt(val.replace('s', '')));
                if (key === 'Match Clock Enabled') setIsMatchClockEnabled(val === 'true');
                if (key === 'Match Clock Duration') setMatchClockDuration(parseTime(val) || 600);
                if (key === 'Player 1 Highlight Color') setPlayer1(p => ({ ...p, color: val }));
                if (key === 'Player 2 Highlight Color') setPlayer2(p => ({ ...p, color: val }));
                if (key === 'Selected Match Index') setSelectedMatchIndex(val === 'NULL' ? null : parseInt(val));
                if (key === 'Show Device Time') setShowDeviceTime(val === 'true');
                if (key === 'Device Time Position X') setDeviceTimePosition(prev => ({ x: parseFloat(val), y: prev?.y || 0 }));
                if (key === 'Device Time Position Y') setDeviceTimePosition(prev => ({ x: prev?.x || 0, y: parseFloat(val) }));
                if (key === 'Match Clock Position X') setMatchClockPosition(prev => ({ x: parseFloat(val), y: prev?.y || 0 }));
                if (key === 'Match Clock Position Y') setMatchClockPosition(prev => ({ x: prev?.x || 0, y: parseFloat(val) }));
                if (key === 'Shot Clock Position X') setShotClockPosition(prev => ({ x: parseFloat(val), y: prev?.y || 0 }));
                if (key === 'Shot Clock Position Y') setShotClockPosition(prev => ({ x: prev?.x || 0, y: parseFloat(val) }));
                if (key === 'Finish Button Position X') setFinishButtonPosition(prev => ({ x: parseFloat(val), y: prev?.y || 0 }));
                if (key === 'Finish Button Position Y') setFinishButtonPosition(prev => ({ x: prev?.x || 0, y: parseFloat(val) }));
              } else if (currentSection === 'PLAYER PREFERENCES') {
                if (values[0] === 'Player Name') return;
                const name = values[0];
                const color = values[1];
                if (name && color) {
                  importedPlayerPreferences[name] = { color, bgColor: '#000000', screenColor: '#000000' };
                }
              }
            });

            setMatchHistory(importedHistory);
            setPlayerPreferences(importedPlayerPreferences);
            updateTeamData(t1Name, t1Players, t2Name, t2Players);
            alert('Tournament data loaded successfully!');
            return;
          }

          const headers = parseCSVLine(lines[0]);
          
          if (headers[0] === 'Team' && headers[1] === 'Player Name') {
            const t1Players: string[] = [];
            const t2Players: string[] = [];
            let t1Name = '';
            let t2Name = '';

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
            let t1Name = '';
            let t2Name = '';

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

              let finalDate = new Date().toISOString();
              if (entry['Date']) {
                const parsed = parseUKDate(entry['Date']);
                if (parsed) {
                  finalDate = parsed;
                } else {
                  const d = new Date(entry['Date']);
                  if (!isNaN(d.getTime())) {
                    finalDate = d.toISOString();
                  }
                }
              }

              history.push({
                id: `imported-${idx}-${Date.now()}`,
                date: finalDate,
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

    // Calculate half-widths for centering widgets based on device and widget type
    const getWidgetHalfW = (type: 'clock' | 'finish') => {
      // Use the stable deviceInfo detection consistent with CSS
      if (type === 'finish') {
        // Mobile: 22vw (!important), Tablet: 20vw, Desktop: 26vw
        if (deviceInfo.isPhone) return windowSize.width * 0.11;
        if (deviceInfo.isTablet) return windowSize.width * 0.1;
        return windowSize.width * 0.13;
      }
      // Clocks - Mobile: 24vw, Tablet: 16vw, Desktop: 20.8vw
      if (deviceInfo.isPhone) return windowSize.width * 0.12;
      if (deviceInfo.isTablet) return windowSize.width * 0.08;
      return windowSize.width * 0.104;
    };

    const halfH = deviceInfo.isPhone ? (windowSize.height * 0.025) : (windowSize.height * (0.04 * deviceInfo.scaleFactor));
    const gap = windowSize.height * (0.05 * deviceInfo.scaleFactor);

    // Default positional offsets to ensure centralized alignment with score digits
    const vOffset = windowSize.height * (0.04 * deviceInfo.scaleFactor); // Back to 4vh raise
    const topBarHeightVal = deviceInfo.isPhone ? windowSize.height * 0.16 : windowSize.height * (0.1 * deviceInfo.scaleFactor);
    const topBarOffset = (deviceInfo.isPhone && !isNavVisible) ? -topBarHeightVal : topBarHeightVal;
    const centerY = (windowSize.height + topBarOffset) / 2;
    const centerX = windowSize.width / 2;

  return (
    <div className={`relative min-h-screen text-slate-100 font-sans selection:bg-emerald-500/30 overflow-x-hidden ${deviceInfo.isPhone ? 'is-phone' : (deviceInfo.isTablet ? 'is-tablet' : 'is-desktop')}`}>
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
          {[player1, player2].map((p) => (
            <div 
              key={p.id} 
              className="flex-1 h-full relative overflow-hidden transition-colors duration-700" 
              style={{ backgroundColor: p.screenColor }}
            >
              {(p.screenStyle === 'cloth' || p.screenStyle === 'speed') && (CLOTH_COLORS.some(c => c.value.toLowerCase() === p.screenColor.toLowerCase()) || SPEED_CLOTH_COLORS.some(c => c.value.toLowerCase() === p.screenColor.toLowerCase())) && (
                <div className="absolute inset-0 z-0 scale-[1.05]">
                  <div 
                    className="w-full h-full border-[1.5vw] border-[#3d2b1f] shadow-[inset_0_0_10vh_rgba(0,0,0,0.5)]" 
                    style={{ backgroundColor: p.screenColor }}
                  >
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: p.screenStyle === 'speed' ? 'radial-gradient(#000 0.5px, transparent 0.5px)' : 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: p.screenStyle === 'speed' ? '0.8vw 0.8vw' : '1.5vw 1.5vw' }} />
                    {/* Corner Pockets */}
                    <div className={`absolute top-0 left-0 w-[8vw] h-[8vw] bg-black rounded-br-2xl shadow-inner ${p.screenStyle === 'speed' ? 'border-2 border-white/10' : ''}`} />
                    <div className={`absolute top-0 right-0 w-[8vw] h-[8vw] bg-black rounded-bl-2xl shadow-inner ${p.screenStyle === 'speed' ? 'border-2 border-white/10' : ''}`} />
                    <div className={`absolute bottom-0 left-0 w-[8vw] h-[8vw] bg-black rounded-tr-2xl shadow-inner ${p.screenStyle === 'speed' ? 'border-2 border-white/10' : ''}`} />
                    <div className={`absolute bottom-0 right-0 w-[8vw] h-[8vw] bg-black rounded-tl-2xl shadow-inner ${p.screenStyle === 'speed' ? 'border-2 border-white/10' : ''}`} />
                    {/* Side Pockets */}
                    <div className={`absolute top-1/2 left-0 -translate-y-1/2 w-[5vw] h-[8vw] bg-black rounded-r-2xl shadow-inner ${p.screenStyle === 'speed' ? 'border-2 border-white/10' : ''}`} />
                    <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-[5vw] h-[8vw] bg-black rounded-l-2xl shadow-inner ${p.screenStyle === 'speed' ? 'border-2 border-white/10' : ''}`} />
                  </div>
                </div>
              )}
              {p.screenStyle === 'dial' && (
                <div 
                  className="absolute inset-0 opacity-40 z-0" 
                  style={{ 
                    backgroundImage: 'linear-gradient(45deg, #111 25.5%, transparent 25.5%), linear-gradient(-45deg, #111 25.5%, transparent 25.5%), linear-gradient(45deg, transparent 74.5%, #111 74.5%), linear-gradient(-45deg, transparent 74.5%, #111 74.5%)',
                    backgroundSize: '8px 8px',
                    backgroundColor: '#1a1a1a'
                  }}
                />
              )}
            </div>
          ))}
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
          y: (!deviceInfo.isDesktop && (
            (!isNavVisible && deviceInfo.isPhone) || 
            (isKeyboardOpen && (deviceInfo.isPhone || (deviceInfo.isTablet && view === 'teams')))
          )) ? (deviceInfo.isPhone ? '-16vh' : '-10vh') : 0,
          opacity: 1
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className={`fixed top-0 left-0 right-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-between px-[0.5vw] nav-zoom`}
        style={{ 
          borderBottom: '2px solid',
          borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1`,
          height: deviceInfo.isPhone ? '16vh' : `${10 * deviceInfo.scaleFactor}vh`
        }}
      >
        <div className="flex items-center gap-[1vw] shrink-0 transform-none">
          <Trophy 
            className="transition-all duration-500" 
            style={{ 
              stroke: 'url(#cup-gradient)',
              width: deviceInfo.isPhone ? '12vh' : `${8 * deviceInfo.scaleFactor}vh`,
              height: deviceInfo.isPhone ? '12vh' : `${8 * deviceInfo.scaleFactor}vh`
            }}
          />
          <h1 
            className={`transition-all duration-500 ${(isShotClockEnabled || isMatchClockEnabled) && deviceInfo.isPhone ? 'hidden' : ''} flex items-center`}
            style={{ 
              height: deviceInfo.isPhone ? '11vh' : `${9 * deviceInfo.scaleFactor}vh`,
            }}
          >
            <svg 
              height="100%" 
              viewBox="0 0 210 40" 
              preserveAspectRatio="xMinYMid meet"
              className="w-auto overflow-visible"
            >
              <defs>
                <linearGradient id="logo-grad-svg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={player1.color} />
                  <stop offset="100%" stopColor={player2.color} />
                </linearGradient>
              </defs>
              <text 
                x="0" 
                y="32" 
                fill="url(#logo-grad-svg)" 
                style={{ 
                  fontFamily: 'Inter, sans-serif', 
                  fontWeight: 900, 
                  fontSize: '32px', 
                  letterSpacing: '-0.03em' 
                }}
              >
                P<tspan textLength="13" lengthAdjust="spacingAndGlyphs">o</tspan><tspan textLength="13" lengthAdjust="spacingAndGlyphs">o</tspan>l<tspan textLength="6" lengthAdjust="spacingAndGlyphs" dx="1">-</tspan><tspan dx="1">P</tspan>r<tspan textLength="13" lengthAdjust="spacingAndGlyphs">o</tspan>.uk
              </text>
            </svg>
          </h1>
        </div>

        {/* Centered Device Time */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 flex items-center pointer-events-none">
          {showDeviceTime && (
            <div 
              className="flex items-center justify-center px-4 rounded-lg bg-black/20 border-2 border-white/5 backdrop-blur-md pointer-events-auto shadow-xl"
              style={{ height: `${9 * deviceInfo.scaleFactor}vh` }}
            >
              <span 
                className="font-mono font-black text-white tracking-wider tabular-nums leading-none"
                style={{
                  fontSize: `${6 * deviceInfo.scaleFactor}vh`
                }}
              >
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-[1vw] shrink-0 justify-end">
          <button 
            onClick={toggleFullscreen}
            className="rounded-xl flex items-center justify-center transition-all duration-500 border border-slate-800 bg-black/50 hover:bg-slate-800/50 flex"
            style={{
              width: deviceInfo.isPhone ? '12.5vh' : `${8 * deviceInfo.scaleFactor}vh`,
              height: deviceInfo.isPhone ? '12.5vh' : `${8 * deviceInfo.scaleFactor}vh`
            }}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? 
              <Minimize 
                style={{ 
                  stroke: 'url(#cup-gradient)',
                  width: deviceInfo.isPhone ? '9.5vh' : `${7 * deviceInfo.scaleFactor}vh`,
                  height: deviceInfo.isPhone ? '9.5vh' : `${7 * deviceInfo.scaleFactor}vh`
                }} 
              /> : 
              <Maximize 
                style={{ 
                  stroke: 'url(#cup-gradient)',
                  width: deviceInfo.isPhone ? '9.5vh' : `${7 * deviceInfo.scaleFactor}vh`,
                  height: deviceInfo.isPhone ? '9.5vh' : `${7 * deviceInfo.scaleFactor}vh`
                }} 
              />
            }
          </button>
          <button 
            onClick={navigateToScoreboard}
            className={`rounded-xl flex items-center justify-center transition-all duration-500 border ${view === 'scoreboard' ? 'border-white/20' : 'border-slate-800'} bg-black/50 hover:bg-slate-800/50`}
            style={{
              backgroundColor: view === 'scoreboard' ? `${player1.color}33` : undefined,
              width: deviceInfo.isPhone ? '12.5vh' : `${8 * deviceInfo.scaleFactor}vh`,
              height: deviceInfo.isPhone ? '12.5vh' : `${8 * deviceInfo.scaleFactor}vh`
            }}
          >
            <Trophy 
              style={{ 
                stroke: 'url(#cup-gradient)',
                width: deviceInfo.isPhone ? '9.5vh' : `${7 * deviceInfo.scaleFactor}vh`,
                height: deviceInfo.isPhone ? '9.5vh' : `${7 * deviceInfo.scaleFactor}vh`
              }} 
            />
          </button>
          <button 
            onClick={() => {
              setView('teams');
              if (deviceInfo.isPhone) setIsNavVisible(false);
            }}
            className={`rounded-xl flex items-center justify-center transition-all duration-500 border ${view === 'teams' ? 'border-white/20' : 'border-slate-800'} bg-black/50 hover:bg-slate-800/50`}
            style={{
              backgroundColor: view === 'teams' ? `${player1.color}33` : undefined,
              width: deviceInfo.isPhone ? '12.5vh' : `${8 * deviceInfo.scaleFactor}vh`,
              height: deviceInfo.isPhone ? '12.5vh' : `${8 * deviceInfo.scaleFactor}vh`
            }}
          >
            <Users 
              style={{ 
                stroke: 'url(#cup-gradient)',
                width: deviceInfo.isPhone ? '9.5vh' : '7vh',
                height: deviceInfo.isPhone ? '9.5vh' : '7vh'
              }} 
            />
          </button>
          <button 
            onClick={() => {
              setView('settings');
              if (deviceInfo.isPhone) setIsNavVisible(false);
            }}
            className={`rounded-xl flex items-center justify-center transition-all duration-500 border ${view === 'settings' ? 'border-white/20' : 'border-slate-800'} bg-black/50 hover:bg-slate-800/50`}
            style={{
              backgroundColor: view === 'settings' ? `${player2.color}33` : undefined,
              width: deviceInfo.isPhone ? '12.5vh' : `${8 * deviceInfo.scaleFactor}vh`,
              height: deviceInfo.isPhone ? '12.5vh' : `${8 * deviceInfo.scaleFactor}vh`
            }}
          >
            <Settings 
              style={{ 
                stroke: 'url(#cup-gradient)',
                width: deviceInfo.isPhone ? '9.5vh' : `${7 * deviceInfo.scaleFactor}vh`,
                height: deviceInfo.isPhone ? '9.5vh' : `${7 * deviceInfo.scaleFactor}vh`
              }} 
            />
          </button>
        </div>
      </motion.nav>

      {/* Vertical Team Names - Moved to root for stability */}
      <AnimatePresence>
        {view === 'scoreboard' && (
          <>
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ 
                opacity: 0.7, 
                x: 0,
                y: (deviceInfo.isPhone && !isNavVisible) ? '-16vh' : 0
              }}
              exit={{ opacity: 0, x: -50 }}
              className="fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] flex flex-col pointer-events-none z-20"
            >
              <div style={{ height: deviceInfo.isPhone ? '16vh' : `${10 * deviceInfo.scaleFactor}vh` }} />
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                <h2 
                  className="vertical-text font-black uppercase tracking-widest select-none whitespace-nowrap leading-none m-0" 
                  style={{ 
                    color: player1.color,
                    fontSize: sharedTeamNameFontSize
                  }}
                >
                  {team1Name}
                </h2>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ 
                opacity: 0.7, 
                x: 0,
                y: (deviceInfo.isPhone && !isNavVisible) ? '-16vh' : 0
              }}
              exit={{ opacity: 0, x: 50 }}
              className="fixed right-0 top-0 bottom-0 w-[var(--sidebar-width)] flex flex-col pointer-events-none z-20"
            >
              <div style={{ height: deviceInfo.isPhone ? '16vh' : `${10 * deviceInfo.scaleFactor}vh` }} />
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                <h2 
                  className="vertical-text font-black uppercase tracking-widest select-none whitespace-nowrap rotate-180 leading-none m-0" 
                  style={{ 
                    color: player2.color,
                    fontSize: sharedTeamNameFontSize
                  }}
                >
                  {team2Name}
                </h2>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Match Clock Widget */}
      <AnimatePresence>
        {isMatchClockEnabled && view === 'scoreboard' && (
          <motion.div
            ref={matchClockRef}
            drag
            dragMomentum={false}
            onDragEnd={() => {
              if (matchClockRef.current) {
                const rect = matchClockRef.current.getBoundingClientRect();
                setMatchClockPosition({ x: rect.left, y: rect.top });
              }
            }}
            initial={matchClockPosition || { 
              x: centerX - getWidgetHalfW('clock'), 
              y: centerY + halfH + gap - vOffset
            }}
            animate={matchClockPosition ? { x: matchClockPosition.x, y: matchClockPosition.y } : {
              x: centerX - getWidgetHalfW('clock'),
              y: centerY + halfH + gap - vOffset
            }}
            className="fixed z-[100] cursor-move pointer-events-auto touch-none"
            style={{ left: 0, top: 0 }}
          >
            <div 
              className="flex items-center justify-between px-1 sm:px-3 rounded-2xl bg-black border-2 shadow-2xl floating-widget"
              style={{ 
                border: '2px solid transparent',
                backgroundImage: `linear-gradient(#000, #000), linear-gradient(${deviceInfo.isPhone ? 'to bottom' : 'to right'}, ${player1.color}, ${player2.color})`,
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box'
              }}
            >
              <div className="flex flex-col items-center justify-center h-full pt-0.5 flex-1">
                <span className="font-black uppercase tracking-[0.2em] text-slate-500 leading-none mb-0.5 widget-label">Match</span>
                <div 
                  className={`flex items-center gap-1 font-mono font-black tabular-nums transition-all duration-500 widget-text ${matchClock <= 60 ? 'text-red-500 animate-pulse scale-110' : 'text-white'}`}
                >
                  <Timer className="widget-icon" />
                  {formatTime(matchClock)}
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  resetMatchClock();
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-slate-400 active:scale-90"
                title="Reset Match Clock"
              >
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Shot Clock Widget */}
      <AnimatePresence>
        {isShotClockEnabled && view === 'scoreboard' && (
          <motion.div
            ref={shotClockRef}
            drag
            dragMomentum={false}
            onDragEnd={() => {
              if (shotClockRef.current) {
                const rect = shotClockRef.current.getBoundingClientRect();
                setShotClockPosition({ x: rect.left, y: rect.top });
              }
            }}
            initial={shotClockPosition || { 
              x: centerX - getWidgetHalfW('clock'), 
              y: centerY - halfH - gap - (halfH * 2) - vOffset
            }}
            animate={shotClockPosition ? { x: shotClockPosition.x, y: shotClockPosition.y } : {
              x: centerX - getWidgetHalfW('clock'),
              y: centerY - halfH - gap - (halfH * 2) - vOffset
            }}
            className="fixed z-[100] cursor-move pointer-events-auto touch-none"
            style={{ left: 0, top: 0 }}
          >
            <div 
              className="flex items-center justify-between px-1 sm:px-3 rounded-2xl bg-black border-2 shadow-2xl floating-widget"
              style={{ 
                border: '2px solid transparent',
                backgroundImage: `linear-gradient(#000, #000), linear-gradient(${deviceInfo.isPhone ? 'to bottom' : 'to right'}, ${player2.color}, ${player1.color})`,
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box'
              }}
            >
              <div className="flex flex-col items-center justify-center h-full pt-0.5 flex-1">
                <span className="font-black uppercase tracking-[0.2em] text-slate-500 leading-none mb-0.5 widget-label">Shot</span>
                <div 
                  className={`flex items-center gap-1 font-mono font-black tabular-nums transition-all duration-500 widget-text ${shotClock <= 5 ? 'text-red-500 animate-pulse scale-110' : 'text-white'}`}
                >
                  <Timer className="widget-icon" />
                  {shotClock}s
                </div>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    isTimerRunning ? pauseTimer() : startTimer();
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-all active:scale-90"
                  style={{ color: isTimerRunning ? player2.color : player1.color }}
                  title={isTimerRunning ? "Pause" : "Start"}
                >
                  {isTimerRunning ? <Pause className="w-3 h-3 sm:w-4 sm:h-4" /> : <Play className="w-3 h-3 sm:w-4 sm:h-4" />}
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    resetTimer();
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-slate-400 active:scale-90"
                  title="Reset Shot Clock"
                >
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Finish Match Button - Centered between cards at root level to avoid transform issues */}
      <AnimatePresence>
        {view === 'scoreboard' && (
          <motion.div 
            ref={finishButtonRef}
            key="finish-button"
            drag
            dragMomentum={false}
            onDragEnd={() => {
              if (finishButtonRef.current) {
                const rect = finishButtonRef.current.getBoundingClientRect();
                setFinishButtonPosition({ x: rect.left, y: rect.top });
              }
            }}
            initial={finishButtonPosition || { 
              x: centerX - getWidgetHalfW('finish'), 
              y: centerY - halfH - vOffset
            }}
            animate={finishButtonPosition ? { x: finishButtonPosition.x, y: finishButtonPosition.y } : {
              x: centerX - getWidgetHalfW('finish'),
              y: centerY - halfH - vOffset
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed z-[100] cursor-move pointer-events-auto touch-none"
            style={{ left: 0, top: 0 }}
          >
            <button
              onClick={finishMatch}
              className="hover:bg-black/40 backdrop-blur-md rounded-2xl flex items-center justify-center font-black transition-all shadow-2xl border-2 active:scale-95 floating-widget widget-finish-match whitespace-nowrap widget-text"
              style={{ 
                border: '2px solid transparent',
                backgroundImage: `linear-gradient(rgba(0,0,0,0.95), rgba(0,0,0,0.95)), linear-gradient(${deviceInfo.isPhone ? 'to bottom' : 'to right'}, ${player2.color}, ${player1.color})`,
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                color: '#fff'
              }}
            >
              <span className="leading-none uppercase tracking-wider">Finish Match</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>



      <motion.main 
        initial={false}
        animate={{ 
          paddingTop: (view === 'teams' || view === 'settings' || view === 'match-details')
            ? `calc(${deviceInfo.isPhone ? '16vh' : (deviceInfo.isTablet ? '8vh' : `${10 * deviceInfo.scaleFactor}vh`)} + ${deviceInfo.isPhone ? '16vh' : (deviceInfo.isTablet ? '8vh' : `${10 * deviceInfo.scaleFactor}vh`)})`
            : (view === 'scoreboard' 
                ? (deviceInfo.isPhone ? '16vh' : (deviceInfo.isTablet ? '8vh' : `${10 * deviceInfo.scaleFactor}vh`)) 
                : 0),
          y: (deviceInfo.isPhone && !isNavVisible && view === 'scoreboard') ? (deviceInfo.isPhone ? '-16vh' : '-10vh') : 0,
          paddingBottom: 0 
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className={`relative z-10 min-h-[100dvh] flex flex-col ${view === 'scoreboard' ? 'justify-center sm:gap-4 lg:gap-6' : 'justify-start pb-24'} px-4 sm:px-6 mx-auto w-full responsive-zoom left-0 right-0`}
        style={{ 
          maxWidth: view === 'scoreboard' ? (deviceInfo.isPhone ? '92vw' : 'var(--gameplay-width)') : (deviceInfo.isDesktop ? `min(95vw, ${985 * deviceInfo.scaleFactor}px)` : 'min(95vw, 985px)'),
          margin: '0 auto'
        }}
      >
        <AnimatePresence mode="wait">
          {view === 'scoreboard' && (
            <motion.div
              key="scoreboard-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex flex-col flex-1 sm:flex-none w-full justify-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="relative flex flex-col gap-2 min-h-0 flex-1 justify-center"
              >
              {/* Score Cards Grid */}
              <div className="relative sm:flex-1 flex items-center justify-center w-full py-0 sm:py-2">
                <div 
                  className={`grid w-full ${deviceInfo.isLandscape ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}
                  style={{ gap: deviceInfo.isPhone ? '2vh' : (deviceInfo.isTablet ? '3vh' : '4vh') }}
                >
                  {[player1, player2].map((p, idx) => (
                      <div key={p.id} className="flex flex-col gap-1 relative">
                        <motion.div
                          onClick={() => {
                            if (!p.isTurn) {
                              setPlayer1(prev => ({ ...prev, isTurn: p.id === '1' }));
                              setPlayer2(prev => ({ ...prev, isTurn: p.id === '2' }));
                              resetTimer();
                            }
                          }}
                          className={`relative transition-all duration-500 cursor-pointer overflow-hidden shadow-2xl flex flex-col justify-center gameplay-card ${
                            p.bgStyle === 'balls' && POOL_BALLS.some(b => b.value.toLowerCase() === p.bgColor.toLowerCase())
                            ? 'rounded-full aspect-square border-0' 
                            : idx === 0 || idx === 1 ? 'rounded-b-3xl sm:rounded-3xl border-2' : 'rounded-3xl border-2'
                          }`}
                          style={{ 
                            padding: deviceInfo.isPhone ? '1vh 2vh' : (deviceInfo.isTablet ? '1.5rem' : '2rem'),
                            borderColor: p.color,
                            backgroundColor: p.bgColor,
                            backgroundImage: p.bgStyle === 'dial' ? 'linear-gradient(45deg, rgba(0,0,0,0.2) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.2) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.2) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.2) 75%)' : undefined,
                            backgroundSize: p.bgStyle === 'dial' ? '4px 4px' : undefined,
                            boxShadow: p.bgStyle === 'balls' && POOL_BALLS.some(b => b.value.toLowerCase() === p.bgColor.toLowerCase())
                              ? 'inset -20px -20px 60px rgba(0,0,0,0.8), inset 20px 20px 60px rgba(255,255,255,0.4), 0 20px 40px rgba(0,0,0,0.5)'
                              : `0 0 40px -15px ${p.color}66`,
                            width: p.bgStyle === 'balls' && POOL_BALLS.some(b => b.value.toLowerCase() === p.bgColor.toLowerCase()) ? 'calc(100% - 2rem)' : undefined,
                            margin: p.bgStyle === 'balls' && POOL_BALLS.some(b => b.value.toLowerCase() === p.bgColor.toLowerCase()) ? '0 auto' : undefined,
                            height: deviceInfo.isLandscape ? '70vh' : undefined
                          }}
                        >
                          {/* Pool Ball Visual Elements (Stripes & Reflections) - Only if Ball mode */}
                          {p.bgStyle === 'balls' && POOL_BALLS.some(b => b.value.toLowerCase() === p.bgColor.toLowerCase()) && (
                             <>
                               {(() => {
                                 const ball = POOL_BALLS.find(b => b.value.toLowerCase() === p.bgColor.toLowerCase());
                                 return (
                                   <>
                                     {ball?.isStripe && (
                                       <div className="absolute inset-x-0 top-[22%] bottom-[22%] bg-white z-0" />
                                     )}
                                     {/* Rotated Numeral Circle */}
                                     <div className={`absolute z-10 top-[15%] ${idx === 0 ? 'right-[15%]' : 'left-[15%]'} w-[25%] aspect-square bg-white rounded-full flex items-center justify-center shadow-lg`}>
                                        <span className="text-black font-black text-sm lg:text-xl leading-none">{ball?.number}</span>
                                     </div>
                                     {/* 3D Highlight shadow wrap */}
                                     <div className="absolute inset-0 z-0 pointer-events-none rounded-full shadow-[inset_-40px_-40px_80px_rgba(0,0,0,0.6)]" />
                                   </>
                                 );
                               })()}
                             </>
                          )}

                             {/* Global Unified Score Buttons - Circular and Anchored to Corners */}
                             
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 incrementScore(p.id);
                               }}
                               className="absolute bottom-[1vh] right-[1vh] rounded-full text-slate-950 flex items-center justify-center transition-all active:scale-95 shadow-lg z-20"
                               style={{ 
                                 width: '15vh',
                                 height: '15vh',
                                 backgroundColor: p.color
                               }}
                             >
                               <Plus className="w-5 h-5 font-bold" />
                             </button>

                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 decrementScore(p.id);
                               }}
                               className="absolute bottom-[2vh] left-[2vh] rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center transition-all active:scale-95 z-20 border border-slate-700"
                               style={{ 
                                 width: '12vh',
                                 height: '12vh'
                               }}
                             >
                               <Minus className="w-4 h-4" />
                             </button>
                              

                           <div className="flex-1 flex flex-col items-center justify-evenly w-full m-0 p-0">
                          {isEditingNames ? (
                            <input
                              type="text"
                              value={p.name}
                              placeholder={`PLAYER ${idx + 1} NAME`}
                              onChange={(e) => idx === 0 ? setPlayer1({...p, name: e.target.value}) : setPlayer2({...p, name: e.target.value})}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-1 text-center font-bold focus:outline-none focus:border-emerald-500 uppercase"
                              style={{ 
                                color: p.color,
                                fontSize: sharedPlayerNameFontSize
                              }}
                            />
                          ) : (
                            p.name && (
                              <h2 
                                className="font-bold uppercase w-full text-center whitespace-nowrap leading-none m-0 p-0" 
                                style={{ 
                                  color: p.color,
                                  fontSize: sharedPlayerNameFontSize
                                }}
                              >
                                {p.name}
                              </h2>
                            )
                          )}

                          <span 
                            className="font-black tracking-tighter tabular-nums leading-[0.75] block m-0 pb-15" 
                            style={{ 
                              color: p.color,
                              fontSize: deviceInfo.isPhone ? '22vw' : (deviceInfo.isTablet ? '15vh' : `${20 * deviceInfo.scaleFactor}vh`)
                            }}
                          >
                            {p.score}
                          </span>
                        </div>
                      </motion.div>
                      {/* White Ball Break Indicator - Outside clipped container to maintain visibility in ball mode */}
                      {isBreakTrackingEnabled && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentBreakPlayerId(p.id as '1' | '2');
                          }}
                          className={`absolute top-2 ${idx === 0 ? 'left-2' : 'right-2'} w-8 h-8 rounded-full border-2 transition-all duration-300 z-50 flex items-center justify-center ${currentBreakPlayerId === p.id ? 'bg-white border-white shadow-[0_0_15px_rgba(255,255,255,0.8)] scale-110' : 'bg-slate-700/50 border-slate-600 scale-90 opacity-40'}`}
                          title="Break Indicator"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Score digit vertical center logic: the button is now moved to root level */}
              </div>
            </motion.div>
          </motion.div>
        )}

          {view === 'teams' && (
            <motion.div
              key="teams"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 pb-10"
            >
              <div 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 transition-all duration-500"
                style={{ 
                  borderBottom: '2px solid',
                  borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1`
                }}
              >
                <div className="space-y-1">
                  <h2 className="font-black uppercase tracking-tight text-white" style={{ fontSize: deviceInfo.isPhone ? '5vh' : (deviceInfo.isTablet ? '3.2vh' : `${3 * deviceInfo.scaleFactor}vw`) }}>Team Setup</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest leading-none" style={{ fontSize: deviceInfo.isPhone ? '1.5vh' : (deviceInfo.isTablet ? '0.9vh' : `${0.7 * deviceInfo.scaleFactor}vw`) }}>Configure your session players</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => setShowExportMenu(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all font-bold text-sm border-2"
                    style={{ 
                      borderColor: player2.color,
                      color: player2.color,
                      backgroundColor: player2.color + '22'
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
                    Clear Team Data
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-10">
                {/* Team 1 Setup */}
                <div className="space-y-4 sm:space-y-8">
                  <div className="space-y-2 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="font-black uppercase tracking-widest text-slate-500" style={{ fontSize: labelFontSize }}>Team 1 Name</label>
                      <Users className="w-4 h-4 text-slate-600" />
                    </div>
                    <input 
                      value={team1Name} 
                      onChange={(e) => updateTeamData(e.target.value.toUpperCase(), team1Players, team2Name, team2Players)}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-black border-2 rounded-xl sm:rounded-2xl font-black text-slate-100 focus:outline-none uppercase transition-all shadow-xl" 
                      style={{ ...teamEntryStyle, borderColor: player1.color }}
                      placeholder="TEAM 1"
                    />
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <label className="font-black uppercase tracking-widest text-slate-500" style={{ fontSize: labelFontSize }}>Players</label>
                    <div className="space-y-2 sm:space-y-3">
                      {team1Players.map((player, idx) => (
                        <div key={idx} className="flex gap-2 sm:gap-3 group">
                          <div 
                            className="w-8 sm:w-10 h-10 sm:h-12 flex items-center justify-center text-[10px] sm:text-xs font-black bg-black border-2 rounded-lg sm:rounded-xl"
                            style={{ borderColor: player1.color + '33', color: player1.color }}
                          >
                            {idx + 1}
                          </div>
                          <div className="relative flex-1 group">
                            <input 
                              value={player}
                              autoFocus={idx === team1Players.length - 1 && player === ''}
                              onChange={(e) => {
                                const newPlayers = [...team1Players];
                                newPlayers[idx] = e.target.value.toUpperCase();
                                updateTeamData(team1Name, newPlayers, team2Name, team2Players);
                              }}
                              onFocus={(e) => e.target.select()}
                              className="w-full bg-black/50 border rounded-lg sm:rounded-xl pr-10 sm:pr-14 text-slate-100 focus:outline-none uppercase font-bold transition-all"
                              style={{ ...playerEntryStyle, borderColor: player1.color + '22' }}
                              placeholder={`P${idx + 1}`}
                            />
                            <button 
                              onClick={() => {
                                const newPlayers = team1Players.filter((_, i) => i !== idx);
                                updateTeamData(team1Name, newPlayers, team2Name, team2Players);
                              }}
                              className="absolute right-0 top-0 h-full px-2 sm:px-4 text-red-500 hover:bg-red-500/10 rounded-r-lg sm:rounded-r-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => updateTeamData(team1Name, [...team1Players, ''], team2Name, team2Players)}
                        className="w-full py-2 sm:py-4 border-2 border-dashed rounded-xl sm:rounded-2xl text-slate-500 transition-all flex items-center justify-center gap-2 text-[10px] sm:text-sm font-black uppercase tracking-widest"
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
                        <Plus className="w-9 h-9" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Team 2 Setup */}
                <div className="space-y-4 sm:space-y-8">
                  <div className="space-y-2 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="font-black uppercase tracking-widest text-slate-500" style={{ fontSize: labelFontSize }}>Team 2 Name</label>
                      <Users className="w-4 h-4 text-slate-600" />
                    </div>
                    <input 
                      value={team2Name} 
                      onChange={(e) => updateTeamData(team1Name, team1Players, e.target.value.toUpperCase(), team2Players)}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-black border-2 rounded-xl sm:rounded-2xl font-black text-slate-100 focus:outline-none uppercase transition-all shadow-xl" 
                      style={{ ...teamEntryStyle, borderColor: player2.color }}
                      placeholder="TEAM 2"
                    />
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <label className="font-black uppercase tracking-widest text-slate-500" style={{ fontSize: labelFontSize }}>Players</label>
                    <div className="space-y-2 sm:space-y-3">
                      {team2Players.map((player, idx) => (
                        <div key={idx} className="flex gap-2 sm:gap-3 group">
                          <div 
                            className="w-8 sm:w-10 h-10 sm:h-12 flex items-center justify-center text-[10px] sm:text-xs font-black bg-black border-2 rounded-lg sm:rounded-xl"
                            style={{ borderColor: player2.color + '33', color: player2.color }}
                          >
                            {idx + 1}
                          </div>
                          <div className="relative flex-1 group">
                            <input 
                              value={player}
                              autoFocus={idx === team2Players.length - 1 && player === ''}
                              onChange={(e) => {
                                const newPlayers = [...team2Players];
                                newPlayers[idx] = e.target.value.toUpperCase();
                                updateTeamData(team1Name, team1Players, team2Name, newPlayers);
                              }}
                              onFocus={(e) => e.target.select()}
                              className="w-full bg-black/50 border rounded-lg sm:rounded-xl pr-10 sm:pr-14 text-slate-100 focus:outline-none uppercase font-bold transition-all"
                              style={{ ...playerEntryStyle, borderColor: player2.color + '22' }}
                              placeholder={`P${idx + 1}`}
                            />
                            <button 
                              onClick={() => {
                                const newPlayers = team2Players.filter((_, i) => i !== idx);
                                updateTeamData(team1Name, team1Players, team2Name, newPlayers);
                              }}
                              className="absolute right-0 top-0 h-full px-2 sm:px-4 text-red-500 hover:bg-red-500/10 rounded-r-lg sm:rounded-r-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => updateTeamData(team1Name, team1Players, team2Name, [...team2Players, ''])}
                        className="w-full py-2 sm:py-4 border-2 border-dashed rounded-xl sm:rounded-2xl text-slate-500 transition-all flex items-center justify-center gap-2 text-[10px] sm:text-sm font-black uppercase tracking-widest"
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
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Match Results Table */}
              <div id="matchups-table" className="space-y-6 pt-8 border-t-2" style={{ borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1` }}>
                <div className="space-y-1">
                  <h3 
                    className="font-black uppercase tracking-tight text-white whitespace-pre-wrap"
                    style={{ fontSize: deviceInfo.isPhone ? '3.5vh' : (deviceInfo.isTablet ? '2.4vh' : `${2.2 * deviceInfo.scaleFactor}vw`) }}
                  >
                    Match Results Table
                  </h3>
                </div>
                <div className="bg-black border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto scrollbar-hide">
                    <table 
                      className="w-full text-left border-collapse table-fixed"
                    >
                      <thead>
                        <tr className="bg-slate-900/80 border-b-2 border-slate-800 font-black">
                          <th className="hidden sm:table-cell px-3 sm:px-6 py-4 text-[15px] uppercase tracking-[0.2em] text-slate-400 w-[8%]">No.</th>
                          <th className="px-1 sm:px-6 py-4 text-xs sm:text-[15px] uppercase tracking-widest text-white w-[27%] sm:w-[22%]">
                            <div className="truncate">{team1Name || 'TEAM A'}</div>
                          </th>
                          <th className="px-0.5 sm:px-6 py-4 text-xs sm:text-[15px] uppercase tracking-widest text-slate-600 text-center w-[12%] sm:w-[8%]">VS</th>
                          <th className="px-1 sm:px-6 py-4 text-xs sm:text-[15px] uppercase tracking-widest text-white w-[27%] sm:w-[22%]">
                            <div className="truncate">{team2Name || 'TEAM B'}</div>
                          </th>
                          <th className="px-1 sm:px-6 py-4 text-xs sm:text-[15px] uppercase tracking-widest text-slate-400 w-[24%] sm:w-[17%]">Result</th>
                          <th className="px-1 sm:px-6 py-4 text-xs sm:text-[15px] uppercase tracking-widest text-slate-400 text-right w-[10%] sm:w-[8%]">Clear Score</th>
                          <th className="hidden sm:table-cell px-3 sm:px-6 py-4 text-[15px] uppercase tracking-widest text-slate-400 w-[15%]">TIMERS</th>
                        </tr>
                      </thead>
                    <tbody>
                      {Math.max(team1Players.length, team2Players.length) === 0 ? (
                        <tr>
                          <td colSpan={windowSize.width < 640 ? 5 : 7} className="px-6 py-12 text-center text-slate-500 italic">Add players to generate matchups.</td>
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
                            const matchup = matchupSettings[idx];
                            const lastMatch = getMatchResult(p1Name, p2Name);
                            
                            // Determine which score to display
                            let displayScore: { score1: number, score2: number, isLive: boolean } | null = null;
                            
                            if (selectedMatchIndex === idx) {
                              // Priority 1: Current active game
                              displayScore = { 
                                score1: player1.score, 
                                score2: player2.score, 
                                isLive: true 
                              };
                            } else if (matchup?.score1 !== undefined || matchup?.score2 !== undefined) {
                              // Priority 2: Other ongoing games in matchupSettings
                              displayScore = { 
                                score1: matchup.score1 || 0, 
                                score2: matchup.score2 || 0, 
                                isLive: true 
                              };
                            } else if (lastMatch) {
                              // Priority 3: Completed historical games
                              displayScore = { 
                                score1: lastMatch.score1,
                                score2: lastMatch.score2,
                                isLive: false 
                              };
                            }
                            
                            return (
                              <tr 
                                key={idx} 
                                onClick={() => selectTeamMatch(idx)}
                                className={`group cursor-pointer transition-colors hover:bg-emerald-500/5 ${selectedMatchIndex === idx ? 'bg-emerald-500/10' : ''}`}
                              >
                                <td className="hidden sm:table-cell px-3 sm:px-6 py-4 text-xs font-black text-slate-600">#{idx + 1}</td>
                                <td className="px-1 sm:px-6 py-4 text-[10px] sm:text-sm text-slate-100 uppercase font-bold group-hover:text-emerald-400 transition-colors truncate">
                                  {p1 || <span className="text-slate-700 italic">EMPTY</span>}
                                </td>
                                <td className="px-0.5 sm:px-6 py-4 text-center text-slate-700 font-black text-[8px]">VS</td>
                                <td className="px-1 sm:px-6 py-4 text-[10px] sm:text-sm text-slate-100 uppercase font-bold group-hover:text-emerald-400 transition-colors truncate">
                                  {p2 || <span className="text-slate-700 italic">EMPTY</span>}
                                </td>
                                <td className="px-1 sm:px-6 py-4">
                                  {displayScore ? (
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                                      <span className={`text-[8px] sm:text-xs font-bold px-1 py-0.5 rounded w-fit ${
                                        displayScore.isLive 
                                          ? 'bg-blue-500/20 text-blue-400' 
                                          : (displayScore as any).winner === p1Name 
                                            ? 'bg-emerald-500/20 text-emerald-400' 
                                            : (displayScore as any).winner === p2Name
                                              ? 'bg-rose-500/20 text-rose-400'
                                              : 'bg-slate-800 text-slate-400'
                                      }`}>
                                        {displayScore.score1}-{displayScore.score2}
                                      </span>
                                      <span className="text-[6px] sm:text-[10px] text-slate-600 font-bold uppercase whitespace-nowrap">{displayScore.isLive ? 'LIVE' : new Date((displayScore as any).date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[8px] text-slate-700 font-bold uppercase">NONE</span>
                                  )}
                                </td>
                                <td className="px-1 sm:px-6 py-4 text-right w-10 sm:w-auto">
                                  <div className="flex items-center justify-end gap-1">
                                    {lastMatch && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          viewMatchDetails(lastMatch.id);
                                        }}
                                        className="p-1 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                        title="View Details"
                                      >
                                        <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                                      </button>
                                    )}
                                    {(lastMatch || matchup) && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          clearMatchResult(p1Name, p2Name, idx);
                                        }}
                                        className="p-1 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Clear Score"
                                      >
                                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="hidden sm:table-cell px-3 sm:px-6 py-4">
                                  {lastMatch && (lastMatch.shotClockSetting || lastMatch.matchClockRemaining !== undefined) ? (
                                    <div className="flex flex-col gap-0.5">
                                      {lastMatch.shotClockSetting && <span className="text-[9px] font-bold text-slate-500">SHOT: {lastMatch.shotClockSetting}S</span>}
                                      {lastMatch.matchClockRemaining !== undefined && <span className="text-[9px] font-bold text-slate-500">MATCH: {formatTime(lastMatch.matchClockRemaining)}</span>}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-600 font-bold uppercase">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {/* Totals Row */}
                          <tr className="bg-slate-900/80 border-t-2 border-slate-800 font-black">
                            <td className="hidden sm:table-cell px-3 sm:px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-emerald-500">Total Score</td>
                            <td className="px-1 sm:px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-base sm:text-2xl text-emerald-400 tabular-nums">{teamTotals.t1}</span>
                                <span className="text-[6px] text-slate-500 uppercase tracking-tighter truncate max-w-[60px] sm:max-w-none">{team1Name}</span>
                              </div>
                            </td>
                            <td className="px-0.5 sm:px-6 py-4 text-center text-slate-700 font-black text-[8px] w-4 sm:w-8">SUM</td>
                            <td className="px-1 sm:px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-base sm:text-2xl text-emerald-400 tabular-nums">{teamTotals.t2}</span>
                                <span className="text-[6px] text-slate-500 uppercase tracking-tighter truncate max-w-[60px] sm:max-w-none">{team2Name}</span>
                              </div>
                            </td>
                            <td colSpan={windowSize.width < 640 ? 1 : 2} className="px-1 sm:px-6 py-4">
                              <div className="flex flex-col items-end">
                                <span className="text-[6px] sm:text-[10px] text-slate-600 uppercase font-bold">Overall Lead</span>
                                <span className="text-[9px] sm:text-sm font-black text-slate-100 truncate max-w-full block">
                                  {teamTotals.t1 === teamTotals.t2 ? 'TIED' : 
                                   teamTotals.t1 > teamTotals.t2 ? `${team1Name} (+${teamTotals.t1 - teamTotals.t2})` : 
                                   `${team2Name} (+${teamTotals.t2 - teamTotals.t1})`}
                                </span>
                              </div>
                            </td>
                            <td className="px-1 sm:px-6 py-4 text-right w-10 sm:w-auto">
                              <button 
                                onClick={() => setShowTeamTotals(true)}
                                className="inline-flex w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500/10 items-center justify-center border border-emerald-500/20 shrink-0 active:scale-95 transition-all hover:bg-emerald-500/20"
                              >
                                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                              </button>
                            </td>
                            <td className="hidden sm:table-cell px-3 sm:px-6 py-4" />
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
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
                <h2 className="font-black uppercase tracking-tight text-white" style={{ fontSize: deviceInfo.isPhone ? '5vh' : (deviceInfo.isTablet ? '3.2vh' : `${3 * deviceInfo.scaleFactor}vw`) }}>Settings</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest leading-none" style={{ fontSize: deviceInfo.isPhone ? '1.5vh' : (deviceInfo.isTablet ? '0.9vh' : `${0.7 * deviceInfo.scaleFactor}vw`) }}>Customize your scoring experience</p>
              </div>

              <div className="space-y-12">
                {/* 1. Colour Preferences */}
                <section className="space-y-6">
                  <h3 
                    className="font-black uppercase tracking-widest pb-2 border-b-2"
                    style={{ 
                      borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1`, 
                      color: player1.color,
                      fontSize: deviceInfo.isPhone ? '1.8vh' : (deviceInfo.isTablet ? '1.4vh' : `${1 * deviceInfo.scaleFactor}vh`)
                    }}
                  >
                    Colour Preferences
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
                        <label 
                          className="font-black uppercase tracking-widest text-slate-500" 
                          style={{ fontSize: labelFontSize }}
                        >
                          Player {idx + 1} Name
                        </label>
                        <Palette className="w-4 h-4" style={{ color: p.color }} />
                      </div>
                        <input
                          type="text"
                          value={p.name}
                          placeholder={`PLAYER ${idx + 1} NAME`}
                          readOnly
                          className="w-full bg-slate-950/30 border border-white/10 rounded-2xl px-6 py-3 text-2xl font-black focus:outline-none uppercase transition-all cursor-not-allowed opacity-70"
                          style={{ 
                            borderColor: 'transparent',
                            outline: 'none',
                            boxShadow: 'none'
                          }}
                        />
                        <div className="space-y-6">
                          <ColorPicker
                            label="Text & Border"
                            value={p.color}
                            onChange={(color) => idx === 0 ? setPlayer1(prev => ({...prev, color})) : setPlayer2(prev => ({...prev, color}))}
                            colors={p.bgStyle === 'dial' ? DIAL_COLORS : THEME_COLORS}
                            icon={<Palette className="w-4 h-4" />}
                            isOpen={activePicker === `p${idx + 1}-theme`}
                            onToggle={(isOpen) => setActivePicker(isOpen ? `p${idx + 1}-theme` : null)}
                            themeColor={p.color}
                            pickerStyle={p.bgStyle === 'dial' ? 'dial' : 'default'}
                            allowedStyles={['default', 'dial']}
                            onStyleChange={(style) => idx === 0 ? setPlayer1(prev => ({...prev, bgStyle: style})) : setPlayer2(prev => ({...prev, bgStyle: style}))}
                          />

                          <ColorPicker
                            label="Card Background"
                            value={p.bgColor}
                            onChange={(color) => idx === 0 ? setPlayer1(prev => ({...prev, bgColor: color})) : setPlayer2(prev => ({...prev, bgColor: color}))}
                            colors={p.bgStyle === 'balls' ? POOL_BALLS : p.bgStyle === 'dial' ? DIAL_COLORS : BACKGROUND_COLORS}
                            icon={<Layout className="w-4 h-4" />}
                            isOpen={activePicker === `p${idx + 1}-bg`}
                            onToggle={(isOpen) => setActivePicker(isOpen ? `p${idx + 1}-bg` : null)}
                            themeColor={p.color}
                            pickerStyle={p.bgStyle || 'default'}
                            allowedStyles={['default', 'balls', 'dial']}
                            onStyleChange={(style) => idx === 0 ? setPlayer1(prev => ({...prev, bgStyle: style})) : setPlayer2(prev => ({...prev, bgStyle: style}))}
                          />

                          <div className="relative">
                            <ColorPicker
                              label="Screen Background"
                              value={p.screenColor}
                              onChange={(color) => idx === 0 ? setPlayer1(prev => ({...prev, screenColor: color})) : setPlayer2(prev => ({...prev, screenColor: color}))}
                              colors={p.screenStyle === 'cloth' ? CLOTH_COLORS : p.screenStyle === 'speed' ? SPEED_CLOTH_COLORS : p.screenStyle === 'dial' ? DIAL_COLORS : BACKGROUND_COLORS}
                              icon={<Maximize className="w-4 h-4" />}
                              isOpen={activePicker === `p${idx + 1}-screen`}
                              onToggle={(isOpen) => setActivePicker(isOpen ? `p${idx + 1}-screen` : null)}
                              themeColor={p.color}
                              pickerStyle={p.screenStyle || 'default'}
                              allowedStyles={['default', 'cloth', 'speed', 'dial']}
                              onStyleChange={(style) => idx === 0 ? setPlayer1(prev => ({...prev, screenStyle: style})) : setPlayer2(prev => ({...prev, screenStyle: style}))}
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

                {/* 2. Break Tracker */}
                <section className="space-y-6">
                  <h3 
                    className="font-black uppercase tracking-widest pb-2 border-b-2"
                    style={{ 
                      borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1`, 
                      color: player1.color,
                      fontSize: deviceInfo.isPhone ? '1.8vh' : (deviceInfo.isTablet ? '1.4vh' : `${1 * deviceInfo.scaleFactor}vh`)
                    }}
                  >
                    Break Tracker
                  </h3>
                  <div 
                    className="bg-black/80 backdrop-blur-md border-2 rounded-[32px] p-8 space-y-8 shadow-xl" 
                    style={{ borderColor: player1.color }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xl font-black text-slate-200 uppercase tracking-tight">Break Tracking</p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Display a "white ball" break indicator that alternates with scores.</p>
                      </div>
                      <button 
                        onClick={() => setIsBreakTrackingEnabled(!isBreakTrackingEnabled)}
                        className={`w-14 h-7 rounded-full transition-colors relative`}
                        style={{ backgroundColor: isBreakTrackingEnabled ? player1.color : '#334155' }}
                      >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isBreakTrackingEnabled ? 'left-8' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </section>

                {/* 3. Device Time */}
                <section className="space-y-6">
                  <h3 
                    className="font-black uppercase tracking-widest pb-2 border-b-2"
                    style={{ 
                      borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1`, 
                      color: player1.color,
                      fontSize: deviceInfo.isPhone ? '1.8vh' : (deviceInfo.isTablet ? '1.4vh' : `${1 * deviceInfo.scaleFactor}vh`)
                    }}
                  >
                    Device Time
                  </h3>
                  <div 
                    className="bg-black/80 backdrop-blur-md border-2 rounded-[32px] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl"
                    style={{ borderColor: player1.color }}
                  >
                    <div className="space-y-1 text-center sm:text-left">
                      <p className="text-xl font-black text-slate-200 uppercase tracking-tight">Show Device Time</p>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Display a draggable clock on the gameplay screen.</p>
                    </div>
                    <button 
                      onClick={() => setShowDeviceTime(!showDeviceTime)}
                      className={`w-14 h-7 rounded-full transition-colors relative`}
                      style={{ backgroundColor: showDeviceTime ? player1.color : '#334155' }}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${showDeviceTime ? 'left-8' : 'left-1'}`} />
                    </button>
                  </div>
                </section>

                {/* 4. Shot Clock */}
                <section className="space-y-6">
                  <h3 
                    className="text-[10px] font-black uppercase tracking-widest pb-2 border-b-2"
                    style={{ borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1`, color: player2.color }}
                  >
                    Shot Clock
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
                          <label className="font-black text-slate-400 uppercase tracking-widest" style={{ fontSize: labelFontSize }}>Timer Duration</label>
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

                {/* 5. Match Clock */}
                <section className="space-y-6">
                  <h3 
                    className="font-black uppercase tracking-widest pb-2 border-b-2"
                    style={{ 
                      borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1`, 
                      color: player1.color,
                      fontSize: deviceInfo.isPhone ? '1.8vh' : (deviceInfo.isTablet ? '1.4vh' : `${1 * deviceInfo.scaleFactor}vh`)
                    }}
                  >
                    Match Clock
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
                          <label className="font-black text-slate-400 uppercase tracking-widest" style={{ fontSize: labelFontSize }}>Match Duration</label>
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

                {/* 6. Restore Defaults */}
                <section className="space-y-6">
                  <h3 
                    className="font-black uppercase tracking-widest pb-2 border-b-2"
                    style={{ 
                      borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1`, 
                      color: player1.color,
                      fontSize: deviceInfo.isPhone ? '1.8vh' : (deviceInfo.isTablet ? '1.4vh' : `${1 * deviceInfo.scaleFactor}vh`)
                    }}
                  >
                    Restore Defaults
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div 
                      className="bg-black/80 backdrop-blur-md border-2 rounded-[32px] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl"
                      style={{ borderColor: player1.color }}
                    >
                      <div className="space-y-1 text-center sm:text-left">
                        <p className="text-xl font-black text-slate-200 uppercase tracking-tight">Restore Defaults</p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Resets colors and clock settings to default.</p>
                      </div>
                      <button 
                        onClick={() => {
                          setShowRestoreDefaultsConfirm(true);
                          setDeviceTimePosition(null);
                        }}
                        className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-700"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore Defaults
                      </button>
                    </div>
                  </div>
                </section>

                <section className="pt-8">
                  <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl relative overflow-hidden">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Server className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black uppercase tracking-tight text-white">API Configuration</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Outbound Tournament Data Sync</p>
                      </div>
                      {isApiLocked ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="password"
                            value={pinInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPinInput(val);
                              if (val === '90210') {
                                setIsApiLocked(false);
                                setPinInput('');
                              }
                            }}
                            placeholder="PIN"
                            className="w-20 bg-black border border-slate-800 rounded-xl px-3 py-2 text-center text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-mono text-sm"
                          />
                        </div>
                      ) : (
                        <button 
                          onClick={() => setIsApiLocked(true)}
                          className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {!isApiLocked ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target URL</label>
                          <input 
                            type="url"
                            value={apiConfig.url}
                            onChange={(e) => setApiConfig(prev => ({ ...prev, url: e.target.value }))}
                            placeholder="https://api.yourserver.com/sync"
                            className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">API Key</label>
                          <input 
                            type="password"
                            value={apiConfig.key}
                            onChange={(e) => setApiConfig(prev => ({ ...prev, key: e.target.value }))}
                            placeholder="Secret API Key"
                            className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                          />
                        </div>
                        <div className="pt-2 flex flex-col gap-3">
                          <button
                            onClick={async () => {
                              console.log('Test Connection clicked');
                              if (!apiConfig.url) {
                                setApiTestStatus({ type: 'error', message: 'Please enter a URL first.' });
                                return;
                              }
                              setIsApiSending(true);
                              setApiTestStatus({ type: 'idle', message: 'Testing...' });
                              try {
                                const testBody = JSON.stringify({ test: true, timestamp: formatDateUK(new Date(), true), type: 'connection_test' });
                                console.log('Testing connection to:', apiConfig.url);
                                const res = await fetch(apiConfig.url, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', 'x-api-key': apiConfig.key },
                                  body: testBody
                                });
                                if (res.ok) {
                                  setApiTestStatus({ type: 'success', message: 'Success! Server responded with 200 OK.' });
                                } else {
                                  setApiTestStatus({ type: 'error', message: `Failed. Server responded with ${res.status}.` });
                                }
                              } catch (err) {
                                console.error('Test Connection Error:', err);
                                setApiTestStatus({ type: 'error', message: 'Connection failed. Check console for CORS/Network errors.' });
                              } finally {
                                setIsApiSending(false);
                              }
                            }}
                            disabled={isApiSending}
                            className="w-full h-10 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all border border-slate-700 flex items-center justify-center gap-2"
                          >
                            {isApiSending ? (
                              <>
                                <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                Testing...
                              </>
                            ) : (
                              <>
                                <Zap className="w-3 h-3 text-amber-400" />
                                Test Connection
                              </>
                            )}
                          </button>

                          {apiTestStatus.type !== 'idle' && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`p-3 rounded-xl text-[10px] font-bold border ${
                                apiTestStatus.type === 'success' 
                                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                                  : 'bg-rose-500/10 border-rose-500/50 text-rose-400'
                              }`}
                            >
                              {apiTestStatus.message}
                            </motion.div>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-600 font-bold uppercase leading-relaxed">
                          This configuration enables the "Send to Server" option in the export menu. 
                          The payload is a full JSON representation of the current tournament state.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 space-y-4 opacity-50">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                          <Layout className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Enter PIN to unlock API settings</p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="pt-12">
                  <div 
                    className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-8 space-y-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                      <span className="text-slate-500">Version</span>
                      <span className="font-mono" style={{ color: player1.color }}>0.6.9-BETA</span>
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

          {view === 'match-details' && (
            <motion.div
              key="match-details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8 pb-20"
            >
              <div 
                className="flex items-center gap-4 pb-8 border-b-2"
                style={{ borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1` }}
              >
                <button 
                  onClick={() => setView('history')}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-all flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white line-clamp-1">Match Details</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px] sm:text-[10px]">Detailed Frame Analysis</p>
                </div>
              </div>

              {matchHistory.find(m => m.id === viewingMatchDetailsId) ? (() => {
                const match = matchHistory.find(m => m.id === viewingMatchDetailsId)!;
                return (
                  <div className="space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-6">
                       <div className="p-3 sm:p-5 rounded-3xl bg-slate-900/50 border border-slate-800/50 shadow-lg">
                          <p className="text-[8px] sm:text-[10px] uppercase font-black text-slate-500 mb-1 lg:tracking-widest">Players</p>
                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
                            <span className="text-sm sm:text-xl font-black text-white uppercase">{match.player1}</span>
                            <span className="text-[8px] sm:text-xs text-slate-600 font-black">VS</span>
                            <span className="text-sm sm:text-xl font-black text-white uppercase">{match.player2}</span>
                          </div>
                          {match.team1 && <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase mt-1.5">{match.team1} vs {match.team2}</p>}
                       </div>
                       <div className="p-3 sm:p-5 rounded-3xl bg-slate-900/50 border border-slate-800/50 text-right shadow-lg">
                          <p className="text-[8px] sm:text-[10px] uppercase font-black text-slate-500 mb-1 lg:tracking-widest">Outcome / Date</p>
                          <p className="text-base sm:text-2xl font-black text-emerald-400 tabular-nums">{match.score1} - {match.score2}</p>
                          <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase mt-1.5">{new Date(match.date).toLocaleString('en-GB')}</p>
                       </div>
                    </div>

                    {/* Frame Table */}
                    <div className="overflow-hidden rounded-3xl border border-slate-800/50 shadow-2xl bg-black/40 backdrop-blur-3xl">
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                          <thead>
                            <tr className="bg-slate-900/80 border-b-2 border-slate-800/50">
                              <th className="px-5 py-5 text-[9px] sm:text-[11px] uppercase tracking-widest font-black text-slate-500 w-[10%]">Frame</th>
                              <th className="px-5 py-5 text-[9px] sm:text-[11px] uppercase tracking-widest font-black text-slate-500 w-[25%]">Breaker</th>
                              <th className="px-5 py-5 text-[9px] sm:text-[11px] uppercase tracking-widest font-black text-slate-500 w-[25%]">Winner</th>
                              <th className="px-5 py-5 text-[9px] sm:text-[11px] uppercase tracking-widest font-black text-slate-500 w-[20%]">Score</th>
                              <th className="px-5 py-5 text-[9px] sm:text-[11px] uppercase tracking-widest font-black text-slate-500 text-right w-[20%]">Timestamp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/30">
                            {match.frameDetails && match.frameDetails.length > 0 ? match.frameDetails.map((frame, fidx) => (
                              <tr key={fidx} className="hover:bg-emerald-500/5 transition-colors group">
                                <td className="px-5 py-4 text-xs sm:text-sm font-black text-slate-600 group-hover:text-emerald-500 transition-colors">#{frame.frameNumber}</td>
                                <td className="px-5 py-4">
                                  <span className="text-xs sm:text-sm font-bold text-slate-300 uppercase letter-spacing-tight">{frame.breakerName}</span>
                                </td>
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs sm:text-sm font-black text-emerald-400 uppercase tracking-tight">{frame.winnerName}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-4 font-mono text-xs sm:text-base text-slate-500 font-bold tabular-nums">
                                  {frame.score1}<span className="text-slate-700 mx-1">-</span>{frame.score2}
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <div className="flex flex-col items-end">
                                    <span className="text-[10px] sm:text-xs font-black text-slate-400 tabular-nums">
                                      {new Date(frame.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                    {frame.duration !== undefined && (
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <Clock className="w-2.5 h-2.5 text-slate-700" />
                                        <span className="text-[8px] sm:text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                                          {Math.floor(frame.duration / 60)}m {frame.duration % 60}s
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={5} className="px-5 py-16 text-center text-slate-600 italic font-medium uppercase tracking-[0.2em] text-[10px]">No detailed frame data available.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-between items-center px-4">
                       <div className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-slate-800" />
                          <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">End of Record</p>
                       </div>
                       {match.shotClockSetting && (
                         <div className="flex items-center gap-2">
                            <Zap className="w-3 h-3 text-slate-700" />
                            <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Shot Clock: {match.shotClockSetting}S Enabled</p>
                         </div>
                       )}
                    </div>
                  </div>
                );
              })() : (
                <div className="py-20 text-center space-y-4">
                  <div className="inline-flex p-5 rounded-full bg-slate-900 border border-slate-800 text-slate-600">
                    <FileText className="w-10 h-10" />
                  </div>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Match record not found.</p>
                  <button onClick={() => setView('history')} className="text-emerald-500 font-black uppercase text-[10px] hover:text-emerald-400 transition-colors">Return to History</button>
                </div>
              )}
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
                  <h3 className="text-xl font-bold">Clear Team Data?</h3>
                </div>
                <p className="text-slate-400">This will permanently delete team names, player lists, current scores, and match history. This action cannot be undone.</p>
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
                    Clear Team Data
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {showExportMenu && (
            <div 
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowExportMenu(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black border-2 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
                style={{ borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-emerald-500">
                    <Download className="w-8 h-8" />
                    <h3 className="text-xl font-bold uppercase tracking-tight">Export Tournament</h3>
                  </div>
                  <button 
                    onClick={() => setShowExportMenu(false)}
                    className="p-2 hover:bg-slate-800 rounded-full transition-all"
                  >
                    <X className="w-6 h-6 text-slate-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Format Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <span className="font-bold uppercase tracking-widest text-xs text-slate-400">File Format</span>
                    <div className="flex bg-black p-1 rounded-xl border border-slate-800">
                      <button 
                        onClick={() => setExportFormat('csv')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${exportFormat === 'csv' ? 'bg-emerald-500 text-slate-950' : 'text-slate-500'}`}
                      >
                        CSV
                      </button>
                      <button 
                        onClick={() => setExportFormat('json')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${exportFormat === 'json' ? 'bg-emerald-500 text-slate-950' : 'text-slate-500'}`}
                      >
                        JSON
                      </button>
                    </div>
                  </div>

                  {/* Export Methods */}
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'download', label: 'Download', icon: Download, desc: 'Save to device' },
                      { id: 'share', label: 'Share', icon: Share2, desc: 'Open system share' },
                      { id: 'server', label: 'Send to Server', icon: Server, desc: 'Upload to tournament server' }
                    ].map((method) => (
                      <button 
                        key={method.id}
                        onClick={() => {
                          const id = method.id as 'download' | 'share' | 'server';
                          setExportMethod(id);
                          if (id === 'server') {
                            setExportFormat('json');
                          } else if (id === 'download') {
                            setExportFormat('csv');
                          } else if (id === 'share') {
                            shareData(exportFormat);
                          }
                        }}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${exportMethod === method.id ? 'bg-emerald-500/10 border-emerald-500' : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'}`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${exportMethod === method.id ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                          <method.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className={`font-black uppercase tracking-tight ${exportMethod === method.id ? 'text-emerald-500' : 'text-slate-200'}`}>{method.label}</div>
                          <div className="text-[11px] font-bold text-slate-100 uppercase tracking-widest">{method.desc}</div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${exportMethod === method.id ? 'border-emerald-500' : 'border-slate-700'}`}>
                          {exportMethod === method.id && <div className="w-3 h-3 bg-emerald-500 rounded-full" />}
                        </div>
                      </button>
                    ))}
                  </div>

                </div>

                <button 
                  onClick={handleExportAction}
                  disabled={isApiSending}
                  className={`w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3 ${isApiSending ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'}`}
                >
                  {isApiSending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      {exportMethod === 'download' && 'Download'}
                      {exportMethod === 'share' && 'Share'}
                      {exportMethod === 'server' && 'Upload to Server'}
                    </>
                  )}
                </button>
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
                <p className="text-slate-400">This will reset all player colors and clock settings to their original defaults. Your names, scores, and history will not be affected.</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowRestoreDefaultsConfirm(false)}
                    className="flex-1 h-12 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      // Restore User Preferences Only (Colors and Clocks)
                      setPlayer1(prev => ({ 
                        ...prev, 
                        color: '#FFFF33', 
                        bgColor: '#000000', 
                        screenColor: '#000000' 
                      }));
                      setPlayer2(prev => ({ 
                        ...prev, 
                        color: '#FF001C', 
                        bgColor: '#000000', 
                        screenColor: '#000000' 
                      }));
                      setShotClockDuration(SHOT_CLOCK_DEFAULT);
                      setIsShotClockEnabled(false);
                      setMatchClockDuration(600);
                      setIsMatchClockEnabled(false);
                      setPlayerPreferences({});
                      setMatchupSettings({});
                      setShowDeviceTime(true);
                      setDeviceTimePosition(null);
                      setMatchClockPosition(null);
                      setShotClockPosition(null);
                      setFinishButtonPosition(null);
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
                initial={{ scale: !deviceInfo.isDesktop ? 0.5 : 0.8, opacity: 0, y: 20 }}
                animate={{ scale: !deviceInfo.isDesktop ? 0.7 : 1, opacity: 1, y: 0 }}
                exit={{ scale: !deviceInfo.isDesktop ? 0.5 : 0.8, opacity: 0, y: 20 }}
                className="bg-black border-2 p-6 sm:p-10 rounded-[30px] sm:rounded-[40px] max-w-2xl w-full space-y-6 sm:space-y-10 text-center"
                style={{ 
                  borderImage: `linear-gradient(to right, ${player1.color} 50%, ${player2.color} 50%) 1`,
                  boxShadow: `0 0 50px ${player1.color}11`
                }}
              >
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <div className="p-3 sm:p-4 rounded-full" style={{ backgroundColor: `${player1.color}22` }}>
                      <Trophy className="w-8 h-8 sm:w-12 sm:h-12" style={{ color: player1.color }} />
                    </div>
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white">Team Totals</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Final Session Results</p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:gap-8 items-center">
                  <div className="space-y-2 sm:space-y-4">
                    <p className="text-sm sm:text-xl font-black uppercase tracking-tight truncate px-1" style={{ color: player1.color }}>{team1Name || 'TEAM 1'}</p>
                    <p className="text-4xl sm:text-8xl font-black text-white tabular-nums">
                      {teamTotals.t1}
                    </p>
                  </div>
                  <div className="space-y-2 sm:space-y-4">
                    <p className="text-sm sm:text-xl font-black uppercase tracking-tight truncate px-1" style={{ color: player2.color }}>{team2Name || 'TEAM 2'}</p>
                    <p className="text-4xl sm:text-8xl font-black text-white tabular-nums">
                      {teamTotals.t2}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setShowTeamTotals(false);
                    setView('teams');
                  }}
                  className="w-full h-14 sm:h-20 text-slate-950 rounded-2xl sm:rounded-3xl font-black text-lg sm:text-2xl uppercase tracking-widest transition-all active:scale-95"
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
      {view !== 'scoreboard' && view !== 'teams' && view !== 'settings' && <div className="h-16 lg:h-32" />}

      {/* Quick Actions Floating Bar (Mobile) */}
      <AnimatePresence>
        {view !== 'scoreboard' && view !== 'teams' && view !== 'settings' && (
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
