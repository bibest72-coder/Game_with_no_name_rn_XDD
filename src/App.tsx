import React, { useState, useEffect, useRef } from 'react';

type ThemeMode = 'black' | 'white';
type ViewMode = 'terminal' | 'letter' | 'easter_egg' | 'doc_01_gr_1' | 'letter_ridge_lodge' | 'list';
type IntroPhase = 'typing' | 'hold' | 'fade_out' | 'blank' | 'completed';

interface LetterCatalogItem {
  id: string;
  cmd: string;
  title: string;
  view: ViewMode;
}

const LETTER_CATALOG: LetterCatalogItem[] = [
  {
    id: 'simple',
    cmd: 'simple',
    title: 'README (咪喵醬的信件)',
    view: 'letter',
  },
  {
    id: 'k33p_1t_s1mpl3',
    cmd: 'K33p_1t_S1mpl3',
    title: 'K33P_1t_S1mpl3 (彩蛋信件)',
    view: 'easter_egg',
  },
  {
    id: '01_gr_1',
    cmd: '01_GR_1',
    title: '01_GR_1 (暴雨中的綠嶺小徑)',
    view: 'doc_01_gr_1',
  },
  {
    id: 'inspect_ri',
    cmd: 'inspect_ri',
    title: '山脊旅店 (Ridge Lodge)',
    view: 'letter_ridge_lodge',
  },
];

const INTRO_TEXT = "天暗示意\n是時候找地方落腳了...";
const CHAR_DELAY = 120; // 舒適且沉浸的無聲打字速度

export default function App() {
  // 一次性重置遊戲至純淨初始狀態 (立即清除先前的所有暫存與記錄)
  if (typeof window !== 'undefined') {
    try {
      const resetKey = 'game_reset_v4_manual';
      if (!localStorage.getItem(resetKey)) {
        localStorage.clear();
        localStorage.setItem(resetKey, 'true');
      }
    } catch {}
  }

  const [theme, setTheme] = useState<ThemeMode>('black');
  const [currentView, setCurrentView] = useState<ViewMode>('terminal');
  const [previousView, setPreviousView] = useState<ViewMode>('terminal');
  const [inputValue, setInputValue] = useState('');
  const [miniInputValue, setMiniInputValue] = useState('');
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  // 自訂資料夾名稱 (可透過 tittle 指令更改並持久化儲存)
  const [folderCustomNames, setFolderCustomNames] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('cli_folder_names');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const getFolderDisplayName = (key: string) => {
    return folderCustomNames[key] || key;
  };

  // 已解鎖觸發的信件記錄 (持久化儲存在 localStorage)
  const [unlockedLetters, setUnlockedLetters] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cli_unlocked_letters');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 資料夾收合狀態
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderKey: string) => {
    setCollapsedFolders(prev => ({
      ...prev,
      [folderKey]: !prev[folderKey],
    }));
  };

  const recordLetterUnlock = (letterId: string) => {
    setUnlockedLetters(prev => {
      if (!prev.includes(letterId)) {
        const next = [...prev, letterId];
        try {
          localStorage.setItem('cli_unlocked_letters', JSON.stringify(next));
        } catch {}
        return next;
      }
      return prev;
    });
  };

  // 當使用者觸發進入任何 letter 時，自動記錄到 list 目錄中
  useEffect(() => {
    if (currentView === 'letter') recordLetterUnlock('simple');
    else if (currentView === 'easter_egg') recordLetterUnlock('k33p_1t_s1mpl3');
    else if (currentView === 'doc_01_gr_1') recordLetterUnlock('01_gr_1');
    else if (currentView === 'letter_ridge_lodge') recordLetterUnlock('inspect_ri');
  }, [currentView]);

  const handleBack = () => {
    if (previousView === 'list') {
      setCurrentView('list');
    } else if (currentView === 'letter_ridge_lodge' && previousView === 'doc_01_gr_1') {
      setCurrentView('doc_01_gr_1');
    } else {
      setCurrentView('terminal');
    }
    setHintMessage(null);
  };

  // User name state with localStorage persistence (已初始化為預設值 'User')
  const [userName, setUserName] = useState<string>(() => {
    try {
      localStorage.removeItem('cli_user_name'); // 清除先前的測試記錄
      return localStorage.getItem('cli_user_name_v2') || 'User';
    } catch {
      return 'User';
    }
  });

  // Entrance typewriter lifecycle: typing -> hold -> fade_out -> blank -> completed
  const [introPhase, setIntroPhase] = useState<IntroPhase>('typing');
  const [displayedText, setDisplayedText] = useState('');
  const [showInput, setShowInput] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const rainAudioRef = useRef<HTMLAudioElement | null>(null);
  const knockAudioRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

useEffect(() => {
  const base = import.meta.env.BASE_URL;

  const rain = new Audio(`${base}assets/audio/rain.wav`);
  rain.loop = true;
  rain.volume = 0.25;

  const knock = new Audio(`${base}assets/audio/knock.mp3`);
  knock.volume = 0.8;

  rainAudioRef.current = rain;
  knockAudioRef.current = knock;

  return () => {
    rain.pause();
    knock.pause();
  };
}, []);

const startRain = () => {
  if (!soundEnabled) return;

  const rain = rainAudioRef.current;
  if (rain && rain.paused) {
    void rain.play().catch(() => {});
  }
};

const playThreeKnocks = () => {
  if (!soundEnabled) return;

  const knock = knockAudioRef.current;
  if (!knock) return;

  [0, 1000, 2000].forEach((delay) => {
    setTimeout(() => {
      if (!soundEnabled) return;
      knock.currentTime = 0;
      void knock.play().catch(() => {});
    }, delay);
  });
};

  // Skip / fast-forward intro
  const skipIntro = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDisplayedText(INTRO_TEXT);
    setIntroPhase('completed');
    setShowInput(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  // 打字主排程程序 (純靜音版本)
  const startTypingSequence = () => {
    let charIndex = 0;
    setDisplayedText('');
    setIntroPhase('typing');
    setShowInput(false);

    const typeNextChar = () => {
      if (charIndex < INTRO_TEXT.length) {
        charIndex++;
        setDisplayedText(INTRO_TEXT.slice(0, charIndex));
        timeoutRef.current = setTimeout(typeNextChar, CHAR_DELAY);
      } else {
        // 1. 打字結束，停留讓使用者沉浸閱讀 (約 1.2 秒)
        setIntroPhase('hold');
        timeoutRef.current = setTimeout(() => {
          // 2. 文字開始緩緩淡出消失 (慢速漸隱，耗時 1.2 秒)
          setIntroPhase('fade_out');
          timeoutRef.current = setTimeout(() => {
            // 3. 留白時間 (完全空白屏息，約 0.65 秒)
            setIntroPhase('blank');
            timeoutRef.current = setTimeout(() => {
              // 4. 輸入欄再緩緩淡入浮現 (1.2 秒平滑浮現)
              setIntroPhase('completed');
              setShowInput(true);
            }, 650);
          }, 1200);
        }, 1200);
      }
    };

    // 稍候 350ms 後開始流暢打字
    timeoutRef.current = setTimeout(typeNextChar, 350);
  };

  // 組件掛載後啟動打字排程
  useEffect(() => {
    startTypingSequence();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // 當輸入欄完全浮現後自動聚焦
  useEffect(() => {
    if (showInput && currentView === 'terminal') {
      inputRef.current?.focus();
    }
  }, [showInput, currentView]);

  // 全域點擊事件
  const handleGlobalClick = () => {
    startRain();
    
    if (introPhase !== 'completed') {
      skipIntro();
      return;
    }
    if (currentView === 'terminal') {
      inputRef.current?.focus();
    }
  };

  // Toggle theme between full black and full white with smooth transition
  const toggleTheme = (target?: ThemeMode) => {
    setTheme(prev => target ?? (prev === 'black' ? 'white' : 'black'));
  };

  // Keyboard shortcuts:
  // - Ctrl+T / Ctrl+B: Toggle theme
  // - Esc: Return to terminal when on letter view
  // - Any key during intro: skip intro
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 全域黑白色彩切換快捷鍵: Ctrl+T 或 Ctrl+B
      if ((e.ctrlKey || e.metaKey) && (e.key === 't' || e.key === 'T' || e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleTheme();
        return;
      }

      if (e.key === 'Escape' && currentView !== 'terminal') {
        e.preventDefault();
        handleBack();
        return;
      }

      // 終端機按 Esc
      if (e.key === 'Escape' && currentView === 'terminal') {
        setHintMessage(null);
      }

      // 入場階段按下任意鍵跳過
      if (introPhase !== 'completed' && currentView === 'terminal') {
        skipIntro();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, previousView, introPhase]);

  // Terminal command submission handler
  const isChapterPattern = (cmd: string) => /^\d+_[A-Za-z]+_\d+$/.test(cmd);

  // 指令核心處理函式 (供主終端機與目錄小輸入欄共用)
  const processCommand = (rawCommand: string) => {
    const command = rawCommand.trim();
    if (!command) return;

    // ========================================================
    // 指令編輯區 (未來可在此直接加入或修改您的自訂指令邏輯)
    // ========================================================
    const lower = command.toLowerCase();
    const args = lower.split(/\s+/);
    const cmd = args[0];

    if (cmd === 'toggle' || cmd === 'invert' || cmd === 'theme') {
      toggleTheme();
      setHintMessage(null);
    } else if (cmd === 'black' || cmd === 'dark') {
      toggleTheme('black');
      setHintMessage(null);
    } else if (cmd === 'white' || cmd === 'light') {
      toggleTheme('white');
      setHintMessage(null);
    } else if (cmd === 'simple') {
      // 導向信件風格頁面
      setCurrentView('letter');
      setHintMessage(null);
    } else if (cmd === 'k33p_1t_s1mpl3') {
      // 彩蛋指令：導向彩蛋信件頁面
      setCurrentView('easter_egg');
      setHintMessage(null);
    } else if (cmd === '01_gr_1' || cmd === '01-gr-1') {
      // 劇情文件指令：導向 01_GR_1 劇情頁面
      setCurrentView('doc_01_gr_1');
      setHintMessage(null);
    } else if (cmd === 'list') {
      // 導向探索記錄目錄 (僅限 list，移除 log 指令)
      setPreviousView(currentView === 'list' ? previousView : currentView);
      setCurrentView('list');
      setHintMessage(null);
    } else if (cmd === 'exit' || cmd === 'back') {
      setCurrentView('terminal');
      setHintMessage(null);
    } else if (lower === 'inspect' || lower === 'inspect_' || lower.startsWith('inspect_') || lower.startsWith('inspect ')) {
      // 物件調查互動指令: inspect_<物件英文前兩字> (例如: inspect_ri)
      let target = '';
      if (lower.startsWith('inspect_')) {
        target = lower.slice('inspect_'.length).trim();
      } else if (lower.startsWith('inspect ')) {
        target = lower.slice('inspect '.length).trim();
      }

      if (!target) {
        setHintMessage('格式錯誤。格式為: inspect_<物件英文前兩字> (例如: inspect_ri)');
      } else if (target.length !== 2 || !/^[a-z]{2}$/.test(target)) {
        setHintMessage('代號格式錯誤。請輸入物件英文名稱的前兩個字母 (例如: inspect_ri)');
      } else if (target === 'ri') {
        // 成功調查「山脊旅店 (Ridge Lodge)」
        setPreviousView(currentView);
        setCurrentView('letter_ridge_lodge');
        setHintMessage(null);
      } else {
        setHintMessage(`未知的目標物件代號: "${target}"。請確認物件英文名稱 (例如: inspect_ri)`);
      }
    } else if (cmd === 'tittle' || cmd === 'title') {
      // 更改資料夾名稱指令: tittle <原本的名字> <要換的名字>
      const rest = command.slice(cmd.length).trim();
      const parts = rest.split(/\s+/);

      if (parts.length < 2 || !parts[0] || !parts[1]) {
        setHintMessage(`格式錯誤。格式為: tittle <原本的名字> <要換的名字>`);
      } else {
        const cleanSpecified = parts[0].replace(/^["']|["']$/g, '');
        const cleanNewName = parts.slice(1).join(' ').trim().replace(/^["']|["']$/g, '');

        if (!cleanNewName) {
          setHintMessage(`格式錯誤。格式為: tittle <原本的名字> <要換的名字>`);
        } else if (/\s/.test(cleanNewName)) {
          // 偵測到新名字包含空格時提示報錯
          setHintMessage(`資料夾名稱不能包含空格，建議使用底線 (例如: chapter_01)`);
        } else {
          // 搜尋所有可能匹配的資料夾 key (包括 'others', 'inspect' 及各章節數字前綴如 '01')
          const allPrefixes = Array.from(new Set([
            'others',
            'inspect',
            ...LETTER_CATALOG.filter(it => isChapterPattern(it.cmd)).map(it => it.cmd.match(/^(\d+)_/)?.[1] || '')
          ])).filter(Boolean);

          const matchedKey = allPrefixes.find(k => {
            const currentDisplay = folderCustomNames[k] || k;
            return k.toLowerCase() === cleanSpecified.toLowerCase() ||
                   currentDisplay.toLowerCase() === cleanSpecified.toLowerCase();
          });

          if (!matchedKey) {
            setHintMessage(`找不到指定的資料夾 "${cleanSpecified}"。`);
          } else {
            const oldDisplayName = folderCustomNames[matchedKey] || matchedKey;
            const nextNames = {
              ...folderCustomNames,
              [matchedKey]: cleanNewName,
            };
            setFolderCustomNames(nextNames);
            try {
              localStorage.setItem('cli_folder_names', JSON.stringify(nextNames));
            } catch {}
            setHintMessage(`資料夾名稱已由 "${oldDisplayName}" 修改為 "${cleanNewName}"`);
          }
        }
      }
    } else if (cmd === 'name') {
      // 指定名字替換指令: name <指定的名字> <要換的名字> (例如: name User aa)
      const rest = command.slice(4).trim();
      
      // 容錯檢查：目前名字是否相符（支援目前名字若帶空格也能被辨識換掉）
      let matchedCurrent = false;
      let newNameCandidate = '';
      let specifiedDisplay = '';

      if (userName && rest.toLowerCase().startsWith(userName.toLowerCase() + ' ')) {
        matchedCurrent = true;
        specifiedDisplay = userName;
        newNameCandidate = rest.slice(userName.length).trim();
      } else {
        const parts = rest.split(/\s+/);
        if (parts.length >= 1 && parts[0]) {
          specifiedDisplay = parts[0].replace(/^["']|["']$/g, '');
          if (specifiedDisplay.toLowerCase() === userName.toLowerCase()) {
            matchedCurrent = true;
            newNameCandidate = parts.slice(1).join(' ').trim();
          }
        }
      }

      if (!rest || !newNameCandidate && !matchedCurrent) {
        setHintMessage(`格式錯誤。格式為: name <指定名字> <要換的名字>`);
      } else if (!matchedCurrent) {
        setHintMessage(`指定的名字 "${specifiedDisplay}" 不相符。 `);
      } else {
        const cleanNewName = newNameCandidate.replace(/^["']|["']$/g, '').trim();

        if (!cleanNewName) {
          setHintMessage(`格式錯誤。格式為: name <指定名字> <要換的名字>`);
        } else if (/\s/.test(cleanNewName)) {
          // 偵測到新名字包含空格時提示報錯
          setHintMessage(`名字不能包含空格，建議使用底線 (例如: so_sad)`);
        } else {
          const oldName = userName;
          setUserName(cleanNewName);
          try {
            localStorage.setItem('cli_user_name_v2', cleanNewName);
          } catch {}
          setHintMessage(`使用者名稱已由 "${oldName}" 修改為 "${cleanNewName}" `);
        }
      }
    } else {
      // 非關鍵字/指令時，顯示柔和呼吸提示文字
      setHintMessage('Type "simple" for help. 👈(ﾟヮﾟ👈) ');
    }
  };

  // Terminal command submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startRain();
    processCommand(inputValue);
    setInputValue('');
  };

  // Mini input bar handler (目錄頁面小輸入欄)
  const handleMiniSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startRain();
    processCommand(miniInputValue);
    setMiniInputValue('');
  };

  // 分組與排序邏輯：
  // 1. inspect 指令獨立一組 [ inspect ]
  // 2. 符合 "數字_字母_數字" (例如 01_GR_1) 的指令，依數字開頭 01, 02, 03... 分資料夾
  // 3. 其他文字指令 (例如 simple, K33p_1t_S1mpl3) 集中置頂於 [ others ]
  const unlockedItems = LETTER_CATALOG.filter(item => unlockedLetters.includes(item.id));

  const inspectItems = unlockedItems.filter(item => item.cmd.startsWith('inspect_'));
  const otherItems = unlockedItems.filter(item => !isChapterPattern(item.cmd) && !item.cmd.startsWith('inspect_'));
  const chapterItems = unlockedItems.filter(item => isChapterPattern(item.cmd));

  const chapterGroups: Record<string, LetterCatalogItem[]> = {};
  chapterItems.forEach(item => {
    const prefix = item.cmd.match(/^(\d+)_/)?.[1] || '00';
    if (!chapterGroups[prefix]) chapterGroups[prefix] = [];
    chapterGroups[prefix].push(item);
  });

  const sortedPrefixes = Object.keys(chapterGroups).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  sortedPrefixes.forEach(prefix => {
    chapterGroups[prefix].sort((a, b) => a.cmd.localeCompare(b.cmd, undefined, { numeric: true }));
  });

  const isDark = theme === 'black';

  return (
    <div
      onClick={handleGlobalClick}
      className={`min-h-screen w-full flex flex-col items-center justify-start font-mono select-none theme-transition cursor-text ${
        currentView === 'list' || isDark ? 'theme-dark bg-black text-white' : 'theme-light bg-white text-black'
      }`}
    >
      {/* Top-Right Theme Switch Button (在全黑 list 介面隱藏) */}
      {currentView !== 'list' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleTheme();
          }}
          className={`fixed top-6 right-6 px-3 py-1 text-xs sm:text-sm border-2 cursor-pointer font-bold tracking-wider uppercase transition-transform active:translate-y-0.5 z-50 ${
            isDark
              ? 'border-white hover:bg-white hover:text-black bg-black text-white'
              : 'border-black hover:bg-black hover:text-white bg-white text-black'
          }`}
          title="切換黑白模式 (快捷鍵: Ctrl+T)"
        >
          {isDark ? '[ SWITCH TO WHITE ]' : '[ SWITCH TO BLACK ]'}
        </button>
      )}

      {/* VIEW 1: Terminal / Input Bar View */}
      {currentView === 'terminal' && (
        <div className="w-full max-w-xl flex flex-col items-center px-4 relative">
          {/* Phase A: Entrance Typewriter Text (僅在入場時出現，字打完後停頓一下再淡出) */}
          {introPhase !== 'completed' && introPhase !== 'blank' && (
            <div
              className={`w-full text-center px-4 pt-[28vh] flex items-center justify-center transition-opacity duration-[1200ms] ease-in-out ${
                introPhase === 'fade_out' ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <h1 className="text-xl sm:text-3xl font-mono tracking-widest leading-relaxed whitespace-pre-line theme-transition">
                {displayedText}
                {introPhase === 'typing' && (
                  <span
                    className={`inline-block w-2.5 h-5 sm:w-3.5 sm:h-7 ml-1.5 align-middle pixel-cursor ${
                      isDark ? 'bg-white' : 'bg-black'
                    }`}
                  />
                )}
              </h1>
            </div>
          )}

          {/* Phase B: Blank state (一樣留空) */}
          {introPhase === 'blank' && (
            <div className="w-full pt-[28vh] min-h-[5rem]" />
          )}

          {/* Phase C: Command Input Section (留空後輸入欄緩緩淡入) */}
          {introPhase === 'completed' && (
            <div
              className={`w-full pt-[25vh] transition-all duration-[1200ms] ease-out flex flex-col items-center ${
                showInput
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              {/* Welcome text with retro breathing blink */}
              <div className="mb-4 text-base sm:text-xl font-mono tracking-widest animate-comfortable-blink select-none theme-transition font-bold text-center">
                Welcome {userName} !
              </div>

              {/* Command Input Form */}
              <form onSubmit={handleSubmit} className="w-full relative" onClick={(e) => e.stopPropagation()}>
                <div className="relative flex items-center w-full">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    autoFocus={showInput}
                    spellCheck={false}
                    className={`w-full text-lg sm:text-2xl py-3 px-4 bg-transparent border-2 outline-none font-mono tracking-wide theme-transition ${
                      isDark
                        ? 'border-white text-white placeholder-white/30 focus:border-white'
                        : 'border-black text-black placeholder-black/30 focus:border-black'
                    }`}
                    placeholder="輸入指令..."
                  />
                  {/* Retro blinking pixel block cursor */}
                  <div
                    className={`absolute right-4 w-3 h-5 pixel-cursor pointer-events-none ${
                      isDark ? 'bg-white' : 'bg-black'
                    }`}
                  />
                </div>
              </form>

              {/* Comfortable Breathing Hint Message: Type "simple" for help. 👈(ﾟヮﾟ👈) */}
              {hintMessage && (
                <div
                  className={`mt-6 text-sm sm:text-base font-mono tracking-wider animate-comfortable-blink select-none theme-transition ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                >
                  {hintMessage}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Letter Page View (信件頁面) */}
      {currentView === 'letter' && (
        <div 
          className="w-full max-w-2xl flex flex-col items-center pt-[10vh] pb-16 px-4 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Minimalist Return Button */}
          <div className="w-full flex justify-start mb-4">
            <button
              type="button"
              onClick={() => setCurrentView('terminal')}
              className={`px-3 py-1 text-xs sm:text-sm border-2 cursor-pointer font-bold tracking-wider uppercase transition-transform active:translate-y-0.5 ${
                isDark
                  ? 'border-white hover:bg-white hover:text-black bg-black text-white'
                  : 'border-black hover:bg-black hover:text-white bg-white text-black'
              }`}
              title="返回 (Esc)"
            >
              [ ◄ 返回 ]
            </button>
          </div>

          {/* Letter Envelope Box (白色框框 像是信件這樣) */}
          <div
            className={`w-full border-2 p-6 sm:p-10 relative theme-transition ${
              isDark ? 'border-white bg-black' : 'border-black bg-white'
            }`}
          >
            {/* Top Postage / Stamp Accent */}
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <span className="text-xl sm:text-2xl font-bold tracking-wider">README</span>
            </div>

            {/* Letter Content Area (信件內容) */}
            <div className="min-h-[220px] sm:min-h-[280px] font-mono leading-relaxed text-xs sm:text-sm space-y-3.5">
              <p className="font-bold text-sm sm:text-base">
                親愛的玩家，歡迎來到沉浸式推理解謎遊戲 <span className="underline underline-offset-4 decoration-1">《K33P_1t_S1mpl3》</span>！o(////▽////)q
              </p>

              <p>
                我是你的 專屬助理 —— <strong className="font-bold">咪喵醬</strong> (￣▽￣)”
              </p>

              <p>
                這封信件裡包含了一些最基本的常用指令跟快鍵，至於更高階的嘛……就要靠你自己去其他神祕文件中發掘囉！（＾-＾）
              </p>

              <p className="opacity-90 italic">
                偷偷告訴你 ~不墨守成規的 咪喵醬 常常觸發意想不到的小驚喜喔？ (//ˋ _ ˊ//)
              </p>

              <p>
                好啦！「User」這個稱呼實在太沒個性了……<br />
                快使用下方指令，給自己取個特別的專屬代號吧！( •̀ ω •́ )
              </p>

              <p className="py-1">
                <span className="font-bold">指令：</span>
                <code className="font-bold px-1.5 py-0.5 border tracking-wider ml-1 inline-block">
                  name &lt;目前名字&gt; &lt;新名字&gt;
                </code>
              </p>

              <p>
                當然！還有其他超酷的魔法喔 
              </p>

              <p>
                用 <code className="font-bold px-1.5 py-0.5 border mx-0.5 inline-block">theme</code> 或 <code className="font-bold px-1.5 py-0.5 border mx-0.5 inline-block">toggle</code> 就能自由切換黑白畫面 
              </p>

              <p>
                如果出現 <span className={`font-bold inline-block ${isDark ? 'text-[#fef08a]' : 'text-[#854d0e] bg-[#fef9c3] px-1 border border-[#facc15]/60'}`}>黃色</span> 的字體時，點下去後會有有趣的事情發生喔 （*＾-＾*）
              </p>

              <p className="pt-1">
                迷路時也別擔心，按一下 <kbd className="font-bold px-1.5 py-0.5 border mx-0.5 inline-block">Esc</kbd> 就能一秒回到輸入欄啦 (๑•̀ㅂ•́)و✧
              </p>

              <p className="pt-2">
                OK 那麼親愛的 <strong className="font-bold">{userName}</strong> 歡迎來到我們創造的世界、聽一個有趣故事 <code className="font-bold px-1.5 py-0.5 border mx-0.5 inline-block cursor-pointer hover:opacity-80" onClick={() => setCurrentView('doc_01_gr_1')} title="點擊或輸入 01_GR_1 前往">01_GR_1</code>
              </p>
            </div>

            {/* Bottom Letter Footer / Divider */}
            <div className="pt-6 border-t mt-6 flex justify-between items-center text-xs opacity-50">
              <span>END OF LETTER</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Easter Egg Letter Page View (彩蛋信件頁面) */}
      {currentView === 'easter_egg' && (
        <div 
          className="w-full max-w-2xl flex flex-col items-center pt-[10vh] pb-16 px-4 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Minimalist Return Button */}
          <div className="w-full flex justify-start mb-4">
            <button
              type="button"
              onClick={() => setCurrentView('terminal')}
              className={`px-3 py-1 text-xs sm:text-sm border-2 cursor-pointer font-bold tracking-wider uppercase transition-transform active:translate-y-0.5 ${
                isDark
                  ? 'border-white hover:bg-white hover:text-black bg-black text-white'
                  : 'border-black hover:bg-black hover:text-white bg-white text-black'
              }`}
              title="返回 (Esc)"
            >
              [ ◄ 返回 ]
            </button>
          </div>

          {/* Letter Envelope Box (與 README 相同外觀的信件框) */}
          <div
            className={`w-full border-2 p-6 sm:p-10 relative theme-transition ${
              isDark ? 'border-white bg-black' : 'border-black bg-white'
            }`}
          >
            {/* Top Postage / Stamp Accent */}
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <span className="text-xl sm:text-2xl font-bold tracking-wider">K33P_1t_S1mpl3</span>
            </div>

            {/* Letter Content Area (彩蛋內容區 - 目前留空供後續填寫) */}
            <div className="min-h-[220px] sm:min-h-[280px] font-mono leading-relaxed text-xs sm:text-sm space-y-3.5">
              {/* 請在此處放入您未來的彩蛋內容 */}
            </div>

            {/* Bottom Letter Footer / Divider */}
            <div className="pt-6 border-t mt-6 flex justify-between items-center text-xs opacity-50">
              <span>END OF LETTER</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: Story Document View (01_GR_1) */}
      {currentView === 'doc_01_gr_1' && (
        <div 
          className="w-full max-w-2xl flex flex-col items-center pt-[10vh] pb-16 px-4 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Minimalist Return Button */}
          <div className="w-full flex justify-start mb-4">
            <button
              type="button"
              onClick={() => setCurrentView('terminal')}
              className={`px-3 py-1 text-xs sm:text-sm border-2 cursor-pointer font-bold tracking-wider uppercase transition-transform active:translate-y-0.5 ${
                isDark
                  ? 'border-white hover:bg-white hover:text-black bg-black text-white'
                  : 'border-black hover:bg-black hover:text-white bg-white text-black'
              }`}
              title="返回 (Esc)"
            >
              [ ◄ 返回 ]
            </button>
          </div>

          {/* Document Box */}
          <div
            className={`w-full border-2 p-6 sm:p-10 relative theme-transition ${
              isDark ? 'border-white bg-black' : 'border-black bg-white'
            }`}
          >
            {/* Top Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <span className="text-xl sm:text-2xl font-bold tracking-wider">01_GR_1</span>
            </div>

            {/* Document Content Area */}
            <div className="min-h-[220px] sm:min-h-[280px] font-mono leading-relaxed text-xs sm:text-sm space-y-3.5">
              <p>狂風裹挾著暴雨，像無數細針砸在視線裡。</p>
              <p>雨水順著我的額頭滑進眼睛，刺得發痛。</p>
              <p>
                獨自走在幾乎要被黑暗吞噬的 <strong className="font-bold">綠嶺小徑</strong>（<strong className="font-bold italic">Green Summit Way</strong>）時，我隱約看見前方出現了一座隱匿在大樹後方的木造建築。
              </p>
              <p>
                門口掛著一盞搖搖欲墜的油燈，映出四個字 ——「
                <span
                  onClick={() => {
                    setPreviousView('doc_01_gr_1');
                    setCurrentView('letter_ridge_lodge');
                  }}
                  className={`inline-block font-bold cursor-pointer transition-colors underline decoration-dotted underline-offset-4 ${
                    isDark
                      ? 'text-[#fef08a] hover:text-[#fffbeb]'
                      : 'text-[#854d0e] bg-[#fef9c3] px-1 border border-[#facc15]/60 hover:bg-[#fef08a]'
                  }`}
                  title="可調查物件：點擊或輸入 inspect_ri 進行互動"
                >
                  山脊旅店 (<span className="italic">Ridge Lodge</span>)
                </span>
                」。
              </p>
              <p>
                <strong className="font-bold">瑪拉</strong>衝上階梯，站在沉重的木門前，抬手緊握銅環。
              </p>
              <p className="tracking-widest">
                叩、叩、叩 ——
              </p>
              <p>
                沒有回應。只有風聲與雨水砸在屋頂上的巨響。
              </p>
              <p>
                她再次發力敲擊。這次，門內傳來了拖沓的腳步聲。
              </p>
              <p className="tracking-widest">
                「吱呀——」
              </p>
            </div>

            {/* Bottom Letter Footer / Divider */}
            <div className="pt-6 border-t mt-6 flex justify-between items-center text-xs opacity-50">
              <span>END OF LETTER</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: Interactive Object Letter View (Ridge Lodge / 山脊旅店) */}
      {currentView === 'letter_ridge_lodge' && (
        <div 
          className="w-full max-w-2xl flex flex-col items-center pt-[10vh] pb-16 px-4 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Minimalist Return Button */}
          <div className="w-full flex justify-start mb-4">
            <button
              type="button"
              onClick={handleBack}
              className={`px-3 py-1 text-xs sm:text-sm border-2 cursor-pointer font-bold tracking-wider uppercase transition-transform active:translate-y-0.5 ${
                isDark
                  ? 'border-white hover:bg-white hover:text-black bg-black text-white'
                  : 'border-black hover:bg-black hover:text-white bg-white text-black'
              }`}
              title="返回 (Esc)"
            >
              [ ◄ 返回 ]
            </button>
          </div>

          {/* Letter Envelope Box (與其他信件同款框框) */}
          <div
            className={`w-full border-2 p-6 sm:p-10 relative theme-transition ${
              isDark ? 'border-white bg-black' : 'border-black bg-white'
            }`}
          >
            {/* Top Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <span className="text-xl sm:text-2xl font-bold tracking-wider">
                山脊旅店 (Ridge Lodge)
              </span>
            </div>

            {/* Letter Content Area (預留給您日後填寫內容) */}
            <div className="min-h-[220px] sm:min-h-[280px] font-mono leading-relaxed text-xs sm:text-sm space-y-3.5">
              {/* 請在此處放入您未來的山脊旅店內容 */}
            </div>

            {/* Bottom Letter Footer / Divider */}
            <div className="pt-6 border-t mt-6 flex justify-between items-center text-xs opacity-50">
              <span>END OF LETTER</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 6: Pure Black Directory / Log View (純黑無框資料夾目錄) */}
      {currentView === 'list' && (
        <div 
          className="w-full min-h-screen bg-black text-white p-6 sm:p-12 font-mono flex flex-col items-start select-none animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar: Return Button & Mini Command Input */}
          <div className="w-full max-w-lg mb-8 space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setCurrentView('terminal');
                  setHintMessage(null);
                }}
                className="px-2.5 py-1 text-xs sm:text-sm border border-white/60 hover:border-white hover:bg-white hover:text-black cursor-pointer font-bold tracking-wider uppercase transition-colors"
                title="返回 (Esc)"
              >
                [ ◄ 返回 ]
              </button>
            </div>

            {/* Mini Command Input Bar for List View */}
            <form onSubmit={handleMiniSubmit} className="relative flex items-center w-full" onClick={(e) => e.stopPropagation()}>
              <span className="mr-2 text-xs font-bold opacity-70">&gt;</span>
              <input
                type="text"
                value={miniInputValue}
                onChange={(e) => setMiniInputValue(e.target.value)}
                placeholder="輸入指令..."
                spellCheck={false}
                className="w-full text-xs sm:text-sm py-1.5 px-3 bg-black border border-white/40 focus:border-white outline-none font-mono tracking-wider placeholder-white/30 text-white"
              />
            </form>

            {/* Hint message in list view (改為純白提示，黃色專供 inspect 物件使用) */}
            {hintMessage && (
              <div className="text-xs font-mono tracking-wider text-white animate-comfortable-blink">
                {hintMessage}
              </div>
            )}
          </div>

          {/* Directory Tree */}
          {unlockedItems.length === 0 ? (
            <div className="text-xs sm:text-sm opacity-40 tracking-wider">
              ( empty )
            </div>
          ) : (
            <div className="space-y-6 w-full max-w-lg">
              {/* 1. Top Group: Other text commands (最頂端其他文字指令) */}
              {otherItems.length > 0 && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleFolder('others')}
                    className="flex items-center gap-2 text-sm sm:text-base font-bold tracking-wider cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <span className="w-3 text-center opacity-70">{collapsedFolders['others'] ? '▶' : '▼'}</span>
                    <span>[ {getFolderDisplayName('others')} ]</span>
                  </button>

                  {!collapsedFolders['others'] && (
                    <div className="pl-6 ml-1.5 border-l border-white/20 space-y-1.5">
                      {otherItems.map(item => (
                        <div key={item.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setPreviousView('list');
                              setCurrentView(item.view);
                            }}
                            className="cursor-pointer text-xs sm:text-sm tracking-wider text-white/90 hover:underline hover:text-white transition-colors py-0.5 block text-left"
                          >
                            {item.cmd}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. Inspect Commands Group (調查物件專屬資料夾) */}
              {inspectItems.length > 0 && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleFolder('inspect')}
                    className="flex items-center gap-2 text-sm sm:text-base font-bold tracking-wider cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <span className="w-3 text-center opacity-70">{collapsedFolders['inspect'] ? '▶' : '▼'}</span>
                    <span>[ {getFolderDisplayName('inspect')} ]</span>
                  </button>

                  {!collapsedFolders['inspect'] && (
                    <div className="pl-6 ml-1.5 border-l border-white/20 space-y-1.5">
                      {inspectItems.map(item => (
                        <div key={item.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setPreviousView('list');
                              setCurrentView(item.view);
                            }}
                            className="cursor-pointer text-xs sm:text-sm tracking-wider text-white/90 hover:underline hover:text-white transition-colors py-0.5 block text-left"
                          >
                            {item.cmd}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Numbered Chapter Groups: 01, 02, 03... */}
              {sortedPrefixes.map(prefix => {
                const items = chapterGroups[prefix] || [];
                const isCollapsed = !!collapsedFolders[prefix];
                return (
                  <div key={prefix} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleFolder(prefix)}
                      className="flex items-center gap-2 text-sm sm:text-base font-bold tracking-wider cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <span className="w-3 text-center opacity-70">{isCollapsed ? '▶' : '▼'}</span>
                      <span>[ {getFolderDisplayName(prefix)} ]</span>
                    </button>

                    {!isCollapsed && (
                      <div className="pl-6 ml-1.5 border-l border-white/20 space-y-1.5">
                        {items.map(item => (
                          <div key={item.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setPreviousView('list');
                                setCurrentView(item.view);
                              }}
                              className="cursor-pointer text-xs sm:text-sm tracking-wider text-white/90 hover:underline hover:text-white transition-colors py-0.5 block text-left"
                            >
                              {item.cmd}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
