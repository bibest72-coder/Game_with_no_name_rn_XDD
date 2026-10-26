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

  const isNameUsedByAnotherRole = (candidate: string, currentRoleName: string) => {
    const cleaned = candidate.trim();
    if (!cleaned) return false;
    return [userName, name6, name7]
      .filter(name => !!name && name.toLowerCase() !== currentRoleName.toLowerCase())
      .some(name => name.toLowerCase() === cleaned.toLowerCase());
  };

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

  const playThreeKnocks = (): Promise<void> => {
    const originalKnock = knockAudioRef.current;

    if (!originalKnock) {
      console.error('[音效] 找不到敲門音效');
      return Promise.resolve();
    }

    knockTimersRef.current.forEach(clearTimeout);
    knockTimersRef.current = [];

    return new Promise((resolve) => {
      let finished = false;
      const fallbackTimer = setTimeout(finish, 12000);
      function finish() {
        if (finished) return;
        finished = true;
        clearTimeout(fallbackTimer);
        resolve();
      }

      [0, 2000, 4000].forEach((delay, index) => {
        const timer = setTimeout(() => {
          const knock = originalKnock.cloneNode(true) as HTMLAudioElement;
          knock.volume = originalKnock.volume;
          knock.currentTime = 0;

          if (index === 2) {
            knock.addEventListener('ended', finish, { once: true });
            knock.addEventListener('error', finish, { once: true });
          }

          console.log(`[音效] 播放第 ${index + 1} 下敲門`, knock.src);
          void knock.play().catch((error) => {
            console.error(`[音效] 第 ${index + 1} 下播放失敗`, error);
            if (index === 2) finish();
          });
        }, delay);

        knockTimersRef.current.push(timer);
      });
    });
  };

  /** 播放木門開啟聲：可在其他解謎事件重複使用 */
  const playDoorOpen = () => {
    const sound = new Audio(
      `${import.meta.env.BASE_URL}assets/audio/door-creak.wav`
    );

    sound.volume = 0.7;
    void sound.play().catch((error) => {
      console.error('[音效] 木門開啟聲播放失敗：', error);
    });
  };

  /** 播放拖沓腳步聲，等待音檔完整播放完畢 */
  const playFootsteps = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const sound = new Audio(
        `${import.meta.env.BASE_URL}assets/audio/footsteps.mp3`
      );

      sound.volume = 0.55;
      let finished = false;
      let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

      const finish = () => {
        if (finished) return;
        finished = true;
        if (fallbackTimer) clearTimeout(fallbackTimer);
        resolve();
      };

      sound.addEventListener('ended', finish, { once: true });
      sound.addEventListener('error', () => {
        if (finished) return;
        finished = true;
        if (fallbackTimer) clearTimeout(fallbackTimer);
        reject(new Error('腳步音效載入失敗，請確認 assets/audio/footsteps.mp3 路徑'));
      }, { once: true });
      sound.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(sound.duration) && sound.duration > 0) {
          fallbackTimer = setTimeout(finish, (sound.duration + 2) * 1000);
        }
      }, { once: true });

      void sound.play().catch((error) => {
        if (fallbackTimer) clearTimeout(fallbackTimer);
        reject(error);
      });
    });
  };

  /** 開場音效順序：三下敲門 → 等 4 秒 → 腳步 → 等 1 秒 → 開門 */
  const playDoorSequence = async () => {
    try {
      await playThreeKnocks();
      await new Promise<void>((resolve) => setTimeout(resolve, 4000));
      await playFootsteps();
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      playDoorOpen();
    } catch (error) {
      console.error('[音效] 故事音效播放失敗：', error);
    }
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
        setIntroPhase('hold');
        timeoutRef.current = setTimeout(() => {
          setIntroPhase('fade_out');
          timeoutRef.current = setTimeout(() => {
            setIntroPhase('blank');
            timeoutRef.current = setTimeout(() => {
              setIntroPhase('completed');
              setShowInput(true);
            }, 650);
          }, 1200);
        }, 1200);
      }
    };

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
      void playDoorSequence();
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
    let fastForwardRequested = false;
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
      if (fastForwardRequested) {
        finish();
        typewriterTimersRef.current.forEach(clearTimeout);
        typewriterTimersRef.current = [];
        return;
      }

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
        fastForwardRequested = true;

        if (finishTyping) {
          finishTyping();
          typewriterTimersRef.current.forEach(clearTimeout);
          typewriterTimersRef.current = [];
        }
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

      if (e.key === 'Escape' && currentView === 'terminal') {
        setHintMessage(null);
      }

      if (introPhase !== 'completed' && currentView === 'terminal') {
        skipIntro();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, previousView, introPhase]);

  // Terminal command submission handler
  const isChapterPattern = (cmd: string) => /^\d+_[A-Za-z]+_\d+$/.test(cmd);

  const processCommand = (rawCommand: string) => {
    const command = rawCommand.trim();
    if (!command) return;

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
      setCurrentView('letter');
      setHintMessage(null);
    } else if (cmd === 'k33p_1t_s1mpl3') {
      setCurrentView('easter_egg');
      setHintMessage(null);
    } else if (cmd === '01_gr_1' || cmd === '01-gr-1') {
      setPreviousView(currentView === 'list' ? 'list' : 'terminal');
      setCurrentView('doc_01_gr_1');
      setHintMessage(null);
    } else if (cmd === '01_te_67' || cmd === '01-te-67') {
      setPreviousView(currentView === 'list' ? 'list' : 'terminal');
      setCurrentView('doc_01_te_67');
      setHintMessage(null);
    } else if (cmd === 'list') {
      setPreviousView(currentView === 'list' ? previousView : currentView);
      setCurrentView('list');
      setHintMessage(null);
    } else if (cmd === 'exit' || cmd === 'back') {
      setCurrentView('terminal');
      setHintMessage(null);
    } else if (lower === 'inspect' || lower === 'inspect_' || lower.startsWith('inspect_') || lower.startsWith('inspect ')) {
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
        setPreviousView(currentView);
        setCurrentView('letter_ridge_lodge');
        setHintMessage(null);
      } else if (target === 'sh') {
        setPreviousView(currentView);
        setCurrentView('letter_shiminaseo');
        setHintMessage(null);
      } else {
        setHintMessage(`未知的目標物件代號: "${target}"。請確認物件英文名稱 (例如: inspect_ri, inspect_sh)`);
      }
    } else if (cmd === 'tittle' || cmd === 'title') {
      const rest = command.slice(cmd.length).trim();
      const parts = rest.split(/\s+/);

      if (parts.length < 2 || !parts[0] || !parts[1]) {
        setHintMessage(`格式錯誤。格式為: tittle <原本的名字> <要換的名字>`);
      } else {
        const cleanSpecified = parts[0].replace(/^['"]|['"]$/g, '');
        const cleanNewName = parts.slice(1).join(' ').trim().replace(/^['"]|['"]$/g, '');

        if (!cleanNewName) {
          setHintMessage(`格式錯誤。格式為: tittle <原本的名字> <要換的名字>`);
        } else if (/\s/.test(cleanNewName)) {
          setHintMessage(`資料夾名稱不能包含空格，建議使用底線 (例如: chapter_01)`);
        } else {
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
            const nextNames = { ...folderCustomNames, [matchedKey]: cleanNewName };
            setFolderCustomNames(nextNames);
            try {
              localStorage.setItem('cli_folder_names', JSON.stringify(nextNames));
            } catch {}
            setHintMessage(`資料夾名稱已由 "${oldDisplayName}" 修改為 "${cleanNewName}"`);
          }
        }
      }
    } else if (cmd === '6') {
      const rest = command.slice(cmd.length).trim();
      const parts = rest.split(/\s+/);

      if (parts.length < 2 || !parts[0] || !parts[1]) {
        setHintMessage(`格式錯誤。格式為: 6 <原本的名字> <要換的名字> (目前名稱: "${name6}")`);
      } else {
        const cleanSpecified = parts[0].replace(/^['"]|['"]$/g, '').trim();
        const cleanNewName = parts.slice(1).join(' ').trim().replace(/^['"]|['"]$/g, '');

        if (!cleanNewName) {
          setHintMessage(`格式錯誤。格式為: 6 <原本的名字> <要換的名字>`);
        } else if (cleanSpecified.toLowerCase() !== name6.toLowerCase()) {
          setHintMessage(`指定的名字 "${cleanSpecified}" 不相符，目前 6 號碼的名稱為 "${name6}"。`);
        } else if (/\s/.test(cleanNewName)) {
          setHintMessage(`名字不能包含空格，建議使用底線 (例如: so_sad)`);
        } else if (isNameUsedByAnotherRole(cleanNewName, name6)) {
          setHintMessage(`名稱 "${cleanNewName}" 已被其他角色使用，因此 6 號碼不能使用它。請換一個新名稱。`);
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
      const rest = command.slice(cmd.length).trim();
      const parts = rest.split(/\s+/);

      if (parts.length < 2 || !parts[0] || !parts[1]) {
        setHintMessage(`格式錯誤。格式為: 7 <原本的名字> <要換的名字> (目前名稱: "${name7}")`);
      } else {
        const cleanSpecified = parts[0].replace(/^['"]|['"]$/g, '').trim();
        const cleanNewName = parts.slice(1).join(' ').trim().replace(/^['"]|['"]$/g, '');

        if (!cleanNewName) {
          setHintMessage(`格式錯誤。格式為: 7 <原本的名字> <要換的名字>`);
        } else if (cleanSpecified.toLowerCase() !== name7.toLowerCase()) {
          setHintMessage(`指定的名字 "${cleanSpecified}" 不相符，目前 7 號碼的名稱為 "${name7}"。`);
        } else if (/\s/.test(cleanNewName)) {
          setHintMessage(`名字不能包含空格，建議使用底線 (例如: so_sad)`);
        } else if (isNameUsedByAnotherRole(cleanNewName, name7)) {
          setHintMessage(`名稱 "${cleanNewName}" 已被其他角色使用，因此 7 號碼不能使用它。請換一個新名稱。`);
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
      const rest = command.slice(cmd.length).trim();
      const parts = rest.split(/\s+/);

      if (parts.length < 2 || !parts[0] || !parts[1]) {
        setHintMessage(`格式錯誤。格式為: name <原本的名字> <要換的名字>`);
      } else {
        const cleanSpecified = parts[0].replace(/^['"]|['"]$/g, '').trim();
        const cleanNewName = parts.slice(1).join(' ').trim().replace(/^['"]|['"]$/g, '');

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
        } else if (isNameUsedByAnotherRole(cleanNewName, cleanSpecified)) {
          setHintMessage(`名稱 "${cleanNewName}" 已被其他角色使用，因此這個角色不能使用它。請換一個新名稱。`);
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
      setHintMessage('Type "simple" for help. 👈(ﾟヮﾟ👈) ');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCommand(inputValue);
    setInputValue('');
  };

  const handleMiniSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCommand(miniInputValue);
    setMiniInputValue('');
  };

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
          isDark ? 'theme-dark bg-black text-white' : 'theme-light bg-white text-black'
        }`}
      >
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

        {currentView === 'terminal' && (
          <div className="w-full max-w-xl flex flex-col items-center px-4 relative">
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

            {introPhase === 'blank' && (
              <div className="w-full pt-[28vh] min-h-[5rem]" />
            )}

            {introPhase === 'completed' && (
              <div
                className={`w-full pt-[25vh] transition-all duration-[1200ms] ease-out flex flex-col items-center ${
                  showInput
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
              >
                <div className="mb-4 text-base sm:text-xl font-mono tracking-widest animate-comfortable-blink select-none theme-transition font-bold text-center">
                  Welcome {userName} !
                </div>

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
                    <div
                      className={`absolute right-4 w-3 h-5 pixel-cursor pointer-events-none ${
                        isDark ? 'bg-white' : 'bg-black'
                      }`}
                    />
                  </div>
                </form>

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

        {currentView === 'letter' && (
          <div className="readme-page w-full max-w-2xl flex flex-col items-center pt-[10vh] pb-16 px-4 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
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

            <div className={`readme-paper w-full border-2 p-6 sm:p-10 relative theme-transition ${isDark ? 'border-white bg-black' : 'border-black bg-white'}`}>
              <span aria-hidden="true" className="readme-border-top pointer-events-none z-20" style={{ backgroundColor: isDark ? '#ffffff' : '#000000' }} />
              <span aria-hidden="true" className="readme-border-left pointer-events-none z-20" style={{ backgroundColor: isDark ? '#ffffff' : '#000000' }} />
              <span aria-hidden="true" className="readme-border-right pointer-events-none z-20" style={{ backgroundColor: isDark ? '#ffffff' : '#000000' }} />
              <span aria-hidden="true" className="readme-border-bottom pointer-events-none z-20" style={{ backgroundColor: isDark ? '#ffffff' : '#000000' }} />

              <div className="flex items-center justify-between border-b pb-4 mb-6">
                <span className="readme-title-hidden text-xl sm:text-2xl font-bold tracking-wider">README</span>
              </div>

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
                  偷偷偷告訴你 ~不墨守成規的 咪喵醬 常常觸發意想不到的小驚喜喔？ (//ˋ _ ˊ//)
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
                  用 <code className="readme-command-frame font-bold px-1.5 py-0.5 border mx-0.5 inline-block">theme</code> 或 <code className="readme-command-frame font-bold px-1.5 py-0.5 border mx-0.5 inline-block">list</code> 來切換黑白視覺與查看檔案清單喔！
                </p>

                <p>
                  如果出現 <span className={`font-bold inline-block ${isDark ? 'text-[#fef08a]' : 'text-[#854d0e] bg-[#fef9c3] px-1 border border-[#facc15]/60'}`}>黃色</span> 的字體時，代表這裡有可互動的線索或入口，別錯過哦！
                </p>

                <p className="pt-1">
                  迷路時也別擔心，按一下 <kbd className="readme-command-frame font-bold px-1.5 py-0.5 border mx-0.5 inline-block">Esc</kbd> 就能一秒回到輸入欄啦 (๑•̀ㅂ•́)و✧
                </p>

                <p className="pt-2">
                  OK 那麼親愛的 <strong className="font-bold">{userName}</strong> 歡迎來到我們創造的世界、聽一個有趣故事 <code className="readme-command-frame readme-command-disabled font-bold px-1.5 py-0.5 border mx-0.5 inline-block">simple</code>。
                </p>
              </div>

              <div className="readme-footer readme-footer-hidden pt-6 border-t mt-6 flex justify-between items-center text-xs opacity-50">
                <span>END OF LETTER</span>
              </div>
            </div>
          </div>
        )}

        {currentView === 'list' && (
          <div className={`w-full min-h-screen p-6 sm:p-12 font-mono flex flex-col items-start select-none animate-fadeIn ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`} onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-lg mb-8 space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('terminal');
                    setHintMessage(null);
                  }}
                  className={`px-2.5 py-1 text-xs sm:text-sm border cursor-pointer font-bold tracking-wider uppercase transition-colors ${
                    isDark
                      ? 'border-white/60 hover:border-white hover:bg-white hover:text-black text-white'
                      : 'border-black/40 hover:border-black hover:bg-black hover:text-white text-black'
                  }`}
                  title="返回 (Esc)"
                >
                  [ ◄ 返回 ]
                </button>
              </div>

              <form onSubmit={handleMiniSubmit} className="relative flex items-center w-full" onClick={(e) => e.stopPropagation()}>
                <span className={`mr-2 text-xs font-bold opacity-70 ${isDark ? 'text-white' : 'text-black'}`}>&gt;</span>
                <input
                  type="text"
                  value={miniInputValue}
                  onChange={(e) => setMiniInputValue(e.target.value)}
                  placeholder="輸入指令..."
                  spellCheck={false}
                  className={`w-full text-xs sm:text-sm py-1.5 px-3 border outline-none font-mono tracking-wider ${
                    isDark
                      ? 'bg-black border-white/40 focus:border-white placeholder-white/30 text-white'
                      : 'bg-white border-black/40 focus:border-black placeholder-black/30 text-black'
                  }`}
                />
              </form>

              {hintMessage && (
                <div className={`text-xs font-mono tracking-wider animate-comfortable-blink ${isDark ? 'text-white' : 'text-black'}`}>
                  {hintMessage}
                </div>
              )}
            </div>

            {unlockedItems.length === 0 ? (
              <div className={`text-xs sm:text-sm opacity-40 tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>( empty )</div>
            ) : (
              <div className="space-y-6 w-full max-w-lg">
                {otherItems.length > 0 && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleFolder('others')}
                      className={`flex items-center gap-2 text-sm sm:text-base font-bold tracking-wider cursor-pointer hover:opacity-80 transition-opacity ${isDark ? 'text-white' : 'text-black'}`}
                    >
                      <span className="w-3 text-center opacity-70">{collapsedFolders['others'] ? '▶' : '▼'}</span>
                      <span>[ {getFolderDisplayName('others')} ]</span>
                    </button>

                    {!collapsedFolders['others'] && (
                      <div className={`pl-6 ml-1.5 border-l space-y-1.5 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
                        {otherItems.map(item => (
                          <div key={item.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setPreviousView('list');
                                setCurrentView(item.view);
                              }}
                              className={`cursor-pointer text-xs sm:text-sm tracking-wider hover:underline transition-colors py-0.5 block text-left ${isDark ? 'text-white/90 hover:text-white' : 'text-black/80 hover:text-black'}`}
                            >
                              {item.cmd}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {inspectItems.length > 0 && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleFolder('inspect')}
                      className={`flex items-center gap-2 text-sm sm:text-base font-bold tracking-wider cursor-pointer hover:opacity-80 transition-opacity ${isDark ? 'text-white' : 'text-black'}`}
                    >
                      <span className="w-3 text-center opacity-70">{collapsedFolders['inspect'] ? '▶' : '▼'}</span>
                      <span>[ {getFolderDisplayName('inspect')} ]</span>
                    </button>

                    {!collapsedFolders['inspect'] && (
                      <div className={`pl-6 ml-1.5 border-l space-y-1.5 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
                        {inspectItems.map(item => (
                          <div key={item.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setPreviousView('list');
                                setCurrentView(item.view);
                              }}
                              className={`cursor-pointer text-xs sm:text-sm tracking-wider hover:underline transition-colors py-0.5 block text-left ${isDark ? 'text-white/90 hover:text-white' : 'text-black/80 hover:text-black'}`}
                            >
                              {item.cmd}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {sortedPrefixes.map(prefix => {
                  const items = chapterGroups[prefix] || [];
                  const isCollapsed = !!collapsedFolders[prefix];
                  return (
                    <div key={prefix} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleFolder(prefix)}
                        className={`flex items-center gap-2 text-sm sm:text-base font-bold tracking-wider cursor-pointer hover:opacity-80 transition-opacity ${isDark ? 'text-white' : 'text-black'}`}
                      >
                        <span className="w-3 text-center opacity-70">{isCollapsed ? '▶' : '▼'}</span>
                        <span>[ {getFolderDisplayName(prefix)} ]</span>
                      </button>

                      {!isCollapsed && (
                        <div className={`pl-6 ml-1.5 border-l space-y-1.5 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
                          {items.map(item => (
                            <div key={item.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviousView('list');
                                  setCurrentView(item.view);
                                }}
                                className={`cursor-pointer text-xs sm:text-sm tracking-wider hover:underline transition-colors py-0.5 block text-left ${isDark ? 'text-white/90 hover:text-white' : 'text-black/80 hover:text-black'}`}
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
