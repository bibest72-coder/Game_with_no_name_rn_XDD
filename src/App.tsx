import React, { useState, useEffect, useRef } from 'react';

type ThemeMode = 'black' | 'white';
type ViewMode = 'terminal' | 'letter' | 'easter_egg' | 'doc_01_gr_1' | 'doc_01_te_67' | 'letter_ridge_lodge' | 'letter_shiminaseo' | 'list';
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
    id: '01_te_67',
    cmd: '01_TE_67',
    title: '01_TE_67',
    view: 'doc_01_te_67',
  },
  {
    id: 'inspect_ri',
    cmd: 'inspect_ri',
    title: '山脊旅店 (Ridge Lodge)',
    view: 'letter_ridge_lodge',
  },
  {
    id: 'inspect_sh',
    cmd: 'inspect_sh',
    title: '尸米那誰喔 (Shiminaseo)',
    view: 'letter_shiminaseo',
  },
];

const INTRO_TEXT = "天暗示意\n是時候找地方落腳了...";
const CHAR_DELAY = 120; // 舒適且沉浸的無聲打字速度

// 照片路徑對應：使用朋友提供的 SVG 檔案
const getPhotoSrc = (img: string): string => {
  const photoMap: Record<string, string> = {
    'image_5a5fbb91.png': `${import.meta.env.BASE_URL}assets/aistudio/200w.gif`,
    'image_fd2bab39.png': `${import.meta.env.BASE_URL}assets/aistudio/42442.jpg`,
  };

  const src = photoMap[img] ?? `${import.meta.env.BASE_URL}assets/aistudio/200w.gif`;
  return src;
};

export default function App() {
  // 一次性重置遊戲至純淨初始狀態 (立即清除先前的所有暫存與記錄，開始全新遊玩)
  if (typeof window !== 'undefined') {
    try {
      const resetKey = 'game_fresh_start_play_v1';
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
    else if (currentView === 'doc_01_te_67') recordLetterUnlock('01_te_67');
    else if (currentView === 'letter_ridge_lodge') recordLetterUnlock('inspect_ri');
    else if (currentView === 'letter_shiminaseo') recordLetterUnlock('inspect_sh');
  }, [currentView]);

  const handleBack = () => {
    if (previousView === 'list') {
      setCurrentView('list');
    } else if (currentView === 'letter_ridge_lodge' && previousView === 'doc_01_gr_1') {
      setCurrentView('doc_01_gr_1');
    } else if (currentView === 'letter_shiminaseo' && previousView === 'doc_01_te_67') {
      setCurrentView('doc_01_te_67');
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

  // 6 號碼的代號/名稱 (預設為 '6'，可透過 6 或 name 指令更名)
  const [name6, setName6] = useState<string>(() => {
    try {
      return localStorage.getItem('cli_name_6') || '6';
    } catch {
      return '6';
    }
  });

  // 7 號碼的代號/名稱 (預設為 '7'，可透過 7 或 name 指令更名)
  const [name7, setName7] = useState<string>(() => {
    try {
      return localStorage.getItem('cli_name_7') || '7';
    } catch {
      return '7';
    }
  });

  // 記錄所有曾經被取過的名字 (防止撞名：先取的之後不能再取)
  const [usedNames, setUsedNames] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cli_used_names');
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch {}
    return ['User', '6', '7'];
  });

  // Entrance typewriter lifecycle: typing -> hold -> fade_out -> blank -> completed
  const [introPhase, setIntroPhase] = useState<IntroPhase>('typing');
  const [displayedText, setDisplayedText] = useState('');
  const [showInput, setShowInput] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 音效：雨聲與三下敲門
const rainAudioRef = useRef<HTMLAudioElement | null>(null);
const knockAudioRef = useRef<HTMLAudioElement | null>(null);
const knockTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
const typewriterAudioContextRef = useRef<AudioContext | null>(null);
const typewriterTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

// 以瀏覽器合成短促的按鍵聲，不需要額外音效檔
const playTypewriterKey = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = typewriterAudioContextRef.current ?? new AudioContextClass();
    typewriterAudioContextRef.current = context;
    if (context.state === 'suspended') void context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1050 + Math.random() * 250, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.025);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.028);
  } catch {
    // 若瀏覽器不支援音效，仍正常播放打字動畫
  }
};

useEffect(() => {
  const base = import.meta.env.BASE_URL;

  const rain = new Audio(`${base}assets/audio/rain.mp3`);
  rain.loop = true;
  rain.volume = 0.6;
  rain.preload = 'auto';

  const knock = new Audio(`${base}assets/audio/knock.wav`);
  knock.volume = 0.8;
  knock.preload = 'auto';

  rainAudioRef.current = rain;
  knockAudioRef.current = knock;

  return () => {
    rain.pause();
    knock.pause();
    knockTimersRef.current.forEach(clearTimeout);
  };
}, []);

const startRain = () => {
  const rain = rainAudioRef.current;
  if (rain && rain.paused) {
    void rain.play().catch(() => {
      // 瀏覽器可能禁止尚未經使用者操作的自動播放
    });
  }
};


  const playThreeKnocks = () => {
  const originalKnock = knockAudioRef.current;

  if (!originalKnock) {
    console.error('[音效] 找不到敲門音效');
    return;
  }

  // 清除上一次尚未執行的敲門計時器
  knockTimersRef.current.forEach(clearTimeout);
  knockTimersRef.current = [];

  // 每次敲門建立獨立播放器，避免互相中斷
  [0, 2000, 4000].forEach((delay, index) => {
    const timer = setTimeout(() => {
      const knock = originalKnock.cloneNode(true) as HTMLAudioElement;
      knock.volume = originalKnock.volume;
      knock.currentTime = 0;

      console.log(`[音效] 播放第 ${index + 1} 下敲門`, knock.src);

      void knock.play().catch((error) => {
        console.error(`[音效] 第 ${index + 1} 下播放失敗`, error);
      });
    }, delay);

    knockTimersRef.current.push(timer);
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


  // 只有進入 01_GR_1 時播放雨聲與三下敲門；離開時停止並清除待播放的敲門
  useEffect(() => {
    if (currentView === 'doc_01_gr_1') {
      startRain();
      playThreeKnocks();
    } else {
      const rain = rainAudioRef.current;
      if (rain) {
        rain.pause();
        rain.currentTime = 0;
      }
      knockTimersRef.current.forEach(clearTimeout);
      knockTimersRef.current = [];
    }
  }, [currentView]);

  // README 逐字打出；Enter / Space 可直接完成。指令框在自身文字打完後才繪製。
  useEffect(() => {
    typewriterTimersRef.current.forEach(clearTimeout);
    typewriterTimersRef.current = [];
    if (currentView !== 'letter') return;

    let cancelled = false;
    let finished = false;
    const page = document.querySelector<HTMLElement>('.readme-page');
    page?.classList.add('readme-typing-active');
    let finishTyping: (() => void) | null = null;
    // 等信紙外框完整展開後，才開始逐字顯示內容。
    const beginTimer = setTimeout(() => {
      const content = document.querySelector<HTMLElement>('.readme-letter-content');
      const title = document.querySelector<HTMLElement>('.readme-title-hidden');
      if (!content || cancelled) return;

      const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];
      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        if (node.nodeValue && node.nodeValue.length > 0) textNodes.push(node);
      }
      const characters: HTMLElement[] = [];
      textNodes.forEach((node) => {
        const fragment = document.createDocumentFragment();
        Array.from(node.nodeValue || '').forEach((character) => {
          const span = document.createElement('span');
          span.textContent = character;
          span.style.visibility = 'hidden';
          span.dataset.readmeCharacter = 'true';
          fragment.appendChild(span);
          characters.push(span);
        });
        node.parentNode?.replaceChild(fragment, node);
      });

      const commandFrames = Array.from(content.querySelectorAll<HTMLElement>('.readme-command-frame'));
      commandFrames.forEach((frame) => {
        frame.classList.remove('readme-frame-draw');
        if (frame.textContent?.includes('01_GR_1')) frame.classList.add('readme-command-disabled');
      });
      content.style.visibility = 'visible';

      const revealFrameIfReady = (frame: HTMLElement) => {
        const chars = Array.from(frame.querySelectorAll<HTMLElement>('[data-readme-character="true"]'));
        if (chars.every((char) => char.style.visibility === 'visible')) {
          frame.classList.remove('readme-command-disabled');
          frame.classList.add('readme-frame-draw');
        }
      };
      const finish = () => {
        if (finished || cancelled) return;
        finished = true;
        characters.forEach((span) => { span.style.visibility = 'visible'; });
        commandFrames.forEach((frame) => {
          frame.classList.remove('readme-command-disabled');
          frame.classList.add('readme-frame-draw');
        });
        if (title) {
          title.classList.remove('readme-title-hidden');
          title.classList.add('readme-title-visible');
        }
        document.querySelector<HTMLElement>('.readme-footer')?.classList.remove('readme-footer-hidden');
        page?.classList.remove('readme-typing-active');
      };
      finishTyping = finish;

      let elapsed = 0;
      let lastParagraph: Element | null = null;
      characters.forEach((span) => {
        const paragraph = span.closest('p');
        if (lastParagraph && paragraph && paragraph !== lastParagraph) elapsed += 420;
        lastParagraph = paragraph || lastParagraph;
        const frame = span.closest<HTMLElement>('.readme-command-frame');
        const delay = elapsed;
        typewriterTimersRef.current.push(setTimeout(() => {
          if (cancelled || finished) return;
          span.style.visibility = 'visible';
          const char = span.textContent || '';
          if (char.trim()) playTypewriterKey();
          if (frame) revealFrameIfReady(frame);
        }, delay));
        elapsed += span.textContent === ' ' || span.textContent === '\n' ? 18 : 38;
      });
      typewriterTimersRef.current.push(setTimeout(finish, elapsed + 20));
    }, 2400);
    typewriterTimersRef.current.push(beginTimer);

    const onFastForward = (event: KeyboardEvent) => {
      if ((event.key === 'Enter' || event.code === 'Space' || event.key === ' ') && !finished) {
        event.preventDefault();
        if (finishTyping) {
          finishTyping();
        } else {
          // 快轉發生在信紙外框動畫期間、逐字程序尚未建立時：直接完成整頁，避免清掉唯一的開始計時器後卡住。
          finished = true;
          const content = document.querySelector<HTMLElement>('.readme-letter-content');
          if (content) content.style.visibility = 'visible';
          document.querySelector<HTMLElement>('.readme-title-hidden')?.classList.replace('readme-title-hidden', 'readme-title-visible');
          document.querySelectorAll<HTMLElement>('.readme-command-frame').forEach((frame) => {
            frame.classList.remove('readme-command-disabled');
            frame.classList.add('readme-frame-draw');
          });
          document.querySelector<HTMLElement>('.readme-footer-hidden')?.classList.remove('readme-footer-hidden');
          document.querySelectorAll<HTMLElement>('.readme-border-top, .readme-border-left, .readme-border-right, .readme-border-bottom').forEach((line) => {
            line.style.animation = 'none';
            line.style.transform = 'none';
          });
          page?.classList.remove('readme-typing-active');
        }
        typewriterTimersRef.current.forEach(clearTimeout);
        typewriterTimersRef.current = [];
      }
    };
    window.addEventListener('keydown', onFastForward);
    return () => {
      cancelled = true;
      window.removeEventListener('keydown', onFastForward);
      typewriterTimersRef.current.forEach(clearTimeout);
      typewriterTimersRef.current = [];
    };
  }, [currentView]);

  // 當輸入欄完全浮現後自動聚焦
  useEffect(() => {
    if (showInput && currentView === 'terminal') {
      inputRef.current?.focus();
    }
  }, [showInput, currentView]);

  // 全域點擊事件
  const handleGlobalClick = () => {
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
      setPreviousView(currentView === 'list' ? 'list' : 'terminal');
      setCurrentView('doc_01_gr_1');
      setHintMessage(null);
    } else if (cmd === '01_te_67' || cmd === '01-te-67') {
      // 劇情文件指令：導向 01_TE_67 劇情頁面
      setPreviousView(currentView === 'list' ? 'list' : 'terminal');
      setCurrentView('doc_01_te_67');
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
      } else if (target === 'sh') {
        // 成功調查「尸米那誰喔 (Shiminaseo)」
        setPreviousView(currentView);
        setCurrentView('letter_shiminaseo');
        setHintMessage(null);
      } else {
        setHintMessage(`未知的目標物件代號: "${target}"。請確認物件英文名稱 (例如: inspect_ri, inspect_sh)`);
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
    } else if (cmd === '6') {
      // 專屬於 6 號碼的更名指令: 6 <原本的名字> <要換的名字>
      const rest = command.slice(cmd.length).trim();
      const parts = rest.split(/\s+/);

      if (parts.length < 2 || !parts[0] || !parts[1]) {
        setHintMessage(`格式錯誤。格式為: 6 <原本的名字> <要換的名字> (目前名稱: "${name6}")`);
      } else {
        const cleanSpecified = parts[0].replace(/^["']|["']$/g, '').trim();
        const cleanNewName = parts.slice(1).join(' ').trim().replace(/^["']|["']$/g, '');

        if (!cleanNewName) {
          setHintMessage(`格式錯誤。格式為: 6 <原本的名字> <要換的名字>`);
        } else if (cleanSpecified.toLowerCase() !== name6.toLowerCase()) {
          setHintMessage(`指定的名字 "${cleanSpecified}" 不相符，目前 6 號碼的名稱為 "${name6}"。`);
        } else if (/\s/.test(cleanNewName)) {
          setHintMessage(`名字不能包含空格，建議使用底線 (例如: so_sad)`);
        } else if (usedNames.some(n => n.toLowerCase() === cleanNewName.toLowerCase())) {
          // 防止撞名字：先取的之後不能取了
          setHintMessage(`名稱 "${cleanNewName}" 已經被使用過，不能重複取名！請換一個新名稱。`);
        } else {
          const oldName = name6;
          setName6(cleanNewName);
          const nextUsed = [...usedNames, cleanNewName];
          setUsedNames(nextUsed);
          try {
            localStorage.setItem('cli_name_6', cleanNewName);
            localStorage.setItem('cli_used_names', JSON.stringify(nextUsed));
          } catch {}
          setHintMessage(`6 號碼名稱已由 "${oldName}" 修改為 "${cleanNewName}"！`);
        }
      }
    } else if (cmd === '7') {
      // 專屬於 7 號碼的更名指令: 7 <原本的名字> <要換的名字>
      const rest = command.slice(cmd.length).trim();
      const parts = rest.split(/\s+/);

      if (parts.length < 2 || !parts[0] || !parts[1]) {
        setHintMessage(`格式錯誤。格式為: 7 <原本的名字> <要換的名字> (目前名稱: "${name7}")`);
      } else {
        const cleanSpecified = parts[0].replace(/^["']|["']$/g, '').trim();
        const cleanNewName = parts.slice(1).join(' ').trim().replace(/^["']|["']$/g, '');

        if (!cleanNewName) {
          setHintMessage(`格式錯誤。格式為: 7 <原本的名字> <要換的名字>`);
        } else if (cleanSpecified.toLowerCase() !== name7.toLowerCase()) {
          setHintMessage(`指定的名字 "${cleanSpecified}" 不相符，目前 7 號碼的名稱為 "${name7}"。`);
        } else if (/\s/.test(cleanNewName)) {
          setHintMessage(`名字不能包含空格，建議使用底線 (例如: so_sad)`);
        } else if (usedNames.some(n => n.toLowerCase() === cleanNewName.toLowerCase())) {
          // 防止撞名字：先取的之後不能取了
          setHintMessage(`名稱 "${cleanNewName}" 已經被使用過，不能重複取名！請換一個新名稱。`);
        } else {
          const oldName = name7;
          setName7(cleanNewName);
          const nextUsed = [...usedNames, cleanNewName];
          setUsedNames(nextUsed);
          try {
            localStorage.setItem('cli_name_7', cleanNewName);
            localStorage.setItem('cli_used_names', JSON.stringify(nextUsed));
          } catch {}
          setHintMessage(`7 號碼名稱已由 "${oldName}" 修改為 "${cleanNewName}"！`);
        }
      }
    } else if (cmd === 'name') {
      // 通用名字更名指令: name <原本的名字> <要換的名字>
      const rest = command.slice(cmd.length).trim();
      const parts = rest.split(/\s+/);

      if (parts.length < 2 || !parts[0] || !parts[1]) {
        setHintMessage(`格式錯誤。格式為: name <原本的名字> <要換的名字>`);
      } else {
        const cleanSpecified = parts[0].replace(/^["']|["']$/g, '').trim();
        const cleanNewName = parts.slice(1).join(' ').trim().replace(/^["']|["']$/g, '');

        if (!cleanNewName) {
          setHintMessage(`格式錯誤。格式為: name <原本的名字> <要換的名字>`);
        } else if (
          cleanSpecified.toLowerCase() !== userName.toLowerCase() &&
          cleanSpecified.toLowerCase() !== name6.toLowerCase() &&
          cleanSpecified.toLowerCase() !== name7.toLowerCase()
        ) {
          setHintMessage(`指定的名字 "${cleanSpecified}" 不相符。`);
        } else if (/\s/.test(cleanNewName)) {
          setHintMessage(`名字不能包含空格，建議使用底線 (例如: so_sad)`);
        } else if (usedNames.some(n => n.toLowerCase() === cleanNewName.toLowerCase())) {
          // 防止撞名字：先取的之後不能取了
          setHintMessage(`名稱 "${cleanNewName}" 已經被使用過，不能重複取名！請換一個新名稱。`);
        } else {
          const isTarget6 = cleanSpecified.toLowerCase() === name6.toLowerCase();
          const isTarget7 = cleanSpecified.toLowerCase() === name7.toLowerCase();
          const oldName = isTarget6 ? name6 : isTarget7 ? name7 : userName;
          if (isTarget6) {
            setName6(cleanNewName);
            try {
              localStorage.setItem('cli_name_6', cleanNewName);
            } catch {}
          } else if (isTarget7) {
            setName7(cleanNewName);
            try {
              localStorage.setItem('cli_name_7', cleanNewName);
            } catch {}
          } else {
            setUserName(cleanNewName);
            try {
              localStorage.setItem('cli_user_name_v2', cleanNewName);
            } catch {}
          }
          const nextUsed = [...usedNames, cleanNewName];
          setUsedNames(nextUsed);
          try {
            localStorage.setItem('cli_used_names', JSON.stringify(nextUsed));
          } catch {}
          setHintMessage(`名稱已由 "${oldName}" 修改為 "${cleanNewName}"！`);
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
    processCommand(inputValue);
    setInputValue('');
  };

  // Mini input bar handler (目錄頁面小輸入欄)
  const handleMiniSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <>
      <style>{`
        @keyframes readmeTopDraw {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes readmeSideDraw {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes readmeBottomDraw {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .readme-paper { border-color: transparent !important; }
        .readme-letter-content { visibility: hidden; }
        .readme-page.readme-typing-active { pointer-events: none !important; }
        .readme-footer-hidden { visibility: hidden; }
        .readme-command-frame { border-color: transparent !important; outline: none !important; position: relative; }
        .readme-command-frame:not(.readme-frame-draw) { box-shadow: none !important; }
        .readme-command-frame.readme-frame-draw::before { content: ""; position: absolute; inset: -2px; border: 1px solid currentColor; pointer-events: none; animation: readmeCommandFrameDraw .55s ease-out both; }
        @keyframes readmeCommandFrameDraw { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
        .readme-command-frame.readme-command-disabled { pointer-events: none !important; cursor: default !important; opacity: .72; }
        .readme-title-hidden { visibility: hidden; }
        .readme-title-visible { visibility: visible; animation: readmeTitleAppear .25s steps(6, end) both; }
        @keyframes readmeTitleAppear { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
        .readme-border-top { position:absolute; top:-2px; left:-2px; right:-2px; height:2px; transform:scaleX(0); transform-origin:left center; animation:readmeTopDraw .65s linear .15s forwards; }
        .readme-border-left { position:absolute; top:-2px; bottom:-2px; left:-2px; width:2px; transform:scaleY(0); transform-origin:top center; animation:readmeSideDraw .85s ease-out .8s forwards; }
        .readme-border-right { position:absolute; top:-2px; bottom:-2px; right:-2px; width:2px; transform:scaleY(0); transform-origin:top center; animation:readmeSideDraw .85s ease-out .8s forwards; }
        .readme-border-bottom { position:absolute; bottom:-2px; left:-2px; right:-2px; height:2px; transform:scaleX(0); transform-origin:left center; animation:readmeBottomDraw .55s linear 1.7s forwards; }
        @media (prefers-reduced-motion: reduce) {
          .readme-border-top, .readme-border-left, .readme-border-right, .readme-border-bottom { animation:none !important; transform:none !important; }
        }
      `}</style>
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
          className="readme-page w-full max-w-2xl flex flex-col items-center pt-[10vh] pb-16 px-4 animate-fadeIn"
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
            className={`readme-paper w-full border-2 p-6 sm:p-10 relative theme-transition ${
              isDark ? 'border-white bg-black' : 'border-black bg-white'
            }`}
          >
            {/* 外框動畫：上邊先畫出，再向下延伸，最後畫出底邊；不改動原本內容尺寸與字體 */}
            <span aria-hidden="true" className="readme-border-top pointer-events-none z-20" style={{ backgroundColor: isDark ? '#ffffff' : '#000000' }} />
            <span aria-hidden="true" className="readme-border-left pointer-events-none z-20" style={{ backgroundColor: isDark ? '#ffffff' : '#000000' }} />
            <span aria-hidden="true" className="readme-border-right pointer-events-none z-20" style={{ backgroundColor: isDark ? '#ffffff' : '#000000' }} />
            <span aria-hidden="true" className="readme-border-bottom pointer-events-none z-20" style={{ backgroundColor: isDark ? '#ffffff' : '#000000' }} />

            {/* Top Postage / Stamp Accent */}
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <span className="readme-title-hidden text-xl sm:text-2xl font-bold tracking-wider">README</span>
            </div>

            {/* Letter Content Area (信件內容) */}
            <div className="readme-letter-content min-h-[220px] sm:min-h-[280px] font-mono leading-relaxed text-xs sm:text-sm space-y-3.5">
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
                <code className="readme-command-frame font-bold px-1.5 py-0.5 border tracking-wider ml-1 inline-block">
                  name &lt;目前名字&gt; &lt;新名字&gt;
                </code>
              </p>

              <p>
                當然！還有其他超酷的魔法喔 
              </p>

              <p>
                用 <code className="readme-command-frame font-bold px-1.5 py-0.5 border mx-0.5 inline-block">theme</code> 或 <code className="readme-command-frame font-bold px-1.5 py-0.5 border mx-0.5 inline-block">toggle</code> 就能自由切換黑白畫面 
              </p>

              <p>
                如果出現 <span className={`font-bold inline-block ${isDark ? 'text-[#fef08a]' : 'text-[#854d0e] bg-[#fef9c3] px-1 border border-[#facc15]/60'}`}>黃色</span> 的字體時，點下去後會有有趣的事情發生喔 （*＾-＾*）
              </p>

              <p className="pt-1">
                迷路時也別擔心，按一下 <kbd className="readme-command-frame font-bold px-1.5 py-0.5 border mx-0.5 inline-block">Esc</kbd> 就能一秒回到輸入欄啦 (๑•̀ㅂ•́)و✧
              </p>

              <p className="pt-2">
                OK 那麼親愛的 <strong className="font-bold">{userName}</strong> 歡迎來到我們創造的世界、聽一個有趣故事 <code className="readme-command-frame readme-command-disabled font-bold px-1.5 py-0.5 border mx-0.5 inline-block cursor-pointer hover:opacity-80" onClick={() => setCurrentView('doc_01_gr_1')} title="點擊或輸入 01_GR_1 前往">01_GR_1</code>
              </p>
            </div>

            {/* Bottom Letter Footer / Divider */}
            <div className="readme-footer readme-footer-hidden pt-6 border-t mt-6 flex justify-between items-center text-xs opacity-50">
              <span>END OF LETTER</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Easter Egg Letter Page View (彩蛋信件頁面) */}
      {currentView === 'easter_egg' && (
        <div 
          className="readme-page w-full max-w-2xl flex flex-col items-center pt-[10vh] pb-16 px-4 animate-fadeIn"
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
            <div className="readme-footer readme-footer-hidden pt-6 border-t mt-6 flex justify-between items-center text-xs opacity-50">
              <span>END OF LETTER</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: Story Document View (01_GR_1) */}
      {currentView === 'doc_01_gr_1' && (
        <div 
          className="readme-page w-full max-w-2xl flex flex-col items-center pt-[10vh] pb-16 px-4 animate-fadeIn"
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
            <div className="readme-footer readme-footer-hidden pt-6 border-t mt-6 flex justify-between items-center text-xs opacity-50">
              <span>END OF LETTER</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: Interactive Object Letter View (Ridge Lodge / 山脊旅店) */}
      {currentView === 'letter_ridge_lodge' && (
        <div 
          className="readme-page w-full max-w-2xl flex flex-col items-center pt-[10vh] pb-16 px-4 animate-fadeIn"
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
            <div className="readme-footer readme-footer-hidden pt-6 border-t mt-6 flex justify-between items-center text-xs opacity-50">
              <span>END OF LETTER</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: 尸米那誰喔 (Shiminaseo) Letter View */}
      {currentView === 'letter_shiminaseo' && (
        <div 
          className="readme-page w-full max-w-2xl flex flex-col items-center pt-[10vh] pb-16 px-4 animate-fadeIn"
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
                尸米那誰喔 (Shiminaseo)
              </span>
            </div>

            {/* Letter Content Area */}
            <div className="min-h-[220px] sm:min-h-[280px] font-mono leading-relaxed text-xs sm:text-sm space-y-3.5">
              <p>
                <span
                  className={`inline-block font-bold ${
                    isDark ? 'text-[#7dd3fc]' : 'text-[#1d4ed8]'
                  }`}
                >
                  {name6}
                </span>
                ：你是從哪裡來的? 你是怎麼來的?
              </p>
              <p className="pl-4 sm:pl-6 opacity-90">
                你知不知道可以用 <code className={`font-bold px-1.5 py-0.5 border mx-0.5 inline-block ${isDark ? 'border-white text-white' : 'border-black text-black'}`}>inspect_sh</code> 來?
              </p>
              <p className="pl-4 sm:pl-6 opacity-90">
                好的現在你知道了~親~ :D
              </p>

              <div className="pt-3 pb-1 pl-4 sm:pl-6 opacity-80 tracking-wider">
                ㄅ一 ㄅ一   迎來到 苡萱醬小課堂 ~
              </div>

              <p className="pt-1">
                <span
                  className={`inline-block font-bold ${
                    isDark ? 'text-[#7dd3fc]' : 'text-[#1d4ed8]'
                  }`}
                >
                  {name6}
                </span>
                ： 尸米那誰喔 is すみません (•ˋ _ ˊ•)
              </p>
              <p className="pl-4 sm:pl-6 opacity-90">
                {'意思是 失禮了、不好意思 (>⇀᷿<)'}
              </p>
              <p className="pl-4 sm:pl-6 opacity-90">
                QQ
              </p>
              <p className="pl-4 sm:pl-6 opacity-90 pt-1">
                但前兩個字是 苡萱醬的食物~ 
              </p>
              <p className="pl-4 sm:pl-6 opacity-90">
                啾咪~ (/▽＼)
              </p>
            </div>

            {/* Bottom Letter Footer / Divider */}
            <div className="readme-footer readme-footer-hidden pt-6 border-t mt-6 flex justify-between items-center text-xs opacity-50">
              <span>END OF LETTER</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: 01_TE_67 Story Document View */}
      {currentView === 'doc_01_te_67' && (
        <div 
          className="readme-page w-full max-w-2xl flex flex-col items-center pt-[10vh] pb-16 px-4 animate-fadeIn"
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
                01_TE_67
              </span>
            </div>

            {/* Letter Content Area */}
            <div className="min-h-[220px] sm:min-h-[280px] font-mono leading-relaxed text-xs sm:text-sm space-y-3.5">
              <p>
                <span
                  className={`inline-block font-bold ${
                    isDark ? 'text-[#7dd3fc]' : 'text-[#1d4ed8]'
                  }`}
                >
                  {name6}
                </span>
                ： 哈喽 大家好 我是苡萱醬 ~~~ o(*////▽////*)q
              </p>
              <p className="pl-4 sm:pl-6 opacity-90">
                我喜歡吃...{' '}
                <span
                  onClick={() => {
                    setPreviousView('doc_01_te_67');
                    setCurrentView('letter_shiminaseo');
                  }}
                  className={`inline-block font-bold cursor-pointer transition-colors underline decoration-dotted underline-offset-4 ${
                    isDark
                      ? 'text-[#fef08a] hover:text-[#fffbeb]'
                      : 'text-[#854d0e] bg-[#fef9c3] px-1 border border-[#facc15]/60 hover:bg-[#fef08a]'
                  }`}
                  title="可調查物件：點擊或輸入 inspect_sh 進行互動"
                >
                  尸米那誰喔 (<span className="italic">Shiminaseo</span>)
                </span>
                {' '}(? www 
              </p>
              <p className="pl-4 sm:pl-6 opacity-90">
                嘿嘿嘿 以下是我的美照 (❁´◡`❁)
              </p>

              {/* 苡萱醬美照展示 */}
              <div className="pt-4 pl-4 sm:pl-6">
                <div
                  className={`inline-block p-2 border-2 ${
                    isDark ? 'border-white/60 bg-white/5' : 'border-black/60 bg-black/5'
                  }`}
                >
                  <img
                    src={getPhotoSrc('image_fd2bab39.png')}
                    alt="苡萱醬的美照"
                    className="max-w-[260px] sm:max-w-[320px] w-full h-auto object-contain block select-none"
                    loading="lazy"
                  />
                  <div className="pt-2 text-[10px] sm:text-xs opacity-60 text-center tracking-wider font-mono">
                    [ 苡萱醬的美照 (❁´◡`❁) ]
                  </div>
                </div>
              </div>

              {/* 杜杜醬 (7) 區塊 */}
              <div className="pt-6 space-y-3.5 border-t border-dashed opacity-95">
                <p>
                  <span
                    className={`inline-block font-bold ${
                      isDark ? 'text-[#7dd3fc]' : 'text-[#1d4ed8]'
                    }`}
                  >
                    {name7}
                  </span>
                  ：大家好~ 我是杜杜醬~ (•ˋ _ ˊ•)
                </p>
                <p className="pl-4 sm:pl-6 opacity-90">
                  我是過來湊數的 ￣へ￣
                </p>
                <p className="pl-4 sm:pl-6 opacity-90">
                  因為咪喵醬希望路徑最後有 67 (?
                </p>

                {/* 杜杜醬照片展示 */}
                <div className="pt-3 pl-4 sm:pl-6">
                  <div
                    className={`inline-block p-2 border-2 ${
                      isDark ? 'border-white/60 bg-white/5' : 'border-black/60 bg-black/5'
                    }`}
                  >
                    <img
                      src={getPhotoSrc('image_5a5fbb91.png')}
                      alt="杜杜醬的美照"
                      className="max-w-[200px] sm:max-w-[240px] w-full h-auto object-contain block select-none"
                      loading="lazy"
                    />
                    <div className="pt-2 text-[10px] sm:text-xs opacity-60 text-center tracking-wider font-mono">
                      [ 杜杜醬 (•ˋ _ ˊ•) ]
                    </div>
                  </div>
                </div>

                {/* 結尾 list 指令框框提示 (純文字 highlight 框框，無超連結) */}
                <p className="pt-4 opacity-90">
                  喔對了.... 可以使用 <code className={`font-bold px-1.5 py-0.5 border mx-0.5 inline-block ${isDark ? 'border-white text-white' : 'border-black text-black'}`}>list</code> 能看到有點過的路徑喔
                </p>
              </div>
            </div>

            {/* Bottom Letter Footer / Divider */}
            <div className="readme-footer readme-footer-hidden pt-6 border-t mt-6 flex justify-between items-center text-xs opacity-50">
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
    </>
  );
}
