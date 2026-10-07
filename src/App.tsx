import React, { useState, useEffect, useRef } from 'react';

type ThemeMode = 'black' | 'white';
type ViewMode = 'terminal' | 'letter';
type IntroPhase = 'typing' | 'hold' | 'fade_out' | 'blank' | 'completed';

const INTRO_TEXT = "天暗示意\n是時候找地方落腳了...";
const CHAR_DELAY = 120; // 舒適且沉浸的無聲打字速度

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>('black');
  const [currentView, setCurrentView] = useState<ViewMode>('terminal');
  const [inputValue, setInputValue] = useState('');
  const [hintMessage, setHintMessage] = useState<string | null>(null);

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

      if (e.key === 'Escape' && currentView === 'letter') {
        e.preventDefault();
        setCurrentView('terminal');
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
  }, [currentView, introPhase]);

  // Terminal command submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const command = inputValue.trim();
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

    // 直接清空輸入欄，不保留任何歷史記錄
    setInputValue('');
  };

  const isDark = theme === 'black';

  return (
    <div
      onClick={handleGlobalClick}
      className={`min-h-screen w-full flex flex-col items-center justify-start font-mono select-none theme-transition cursor-text ${
        isDark ? 'theme-dark bg-black text-white' : 'theme-light bg-white text-black'
      }`}
    >
      {/* Top-Right Theme Switch Button */}
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
                用 <code className="font-bold px-1.5 py-0.5 border mx-0.5 inline-block">theme</code> 或 <code className="font-bold px-1.5 py-0.5 border mx-0.5 inline-block">toggle</code> 就能自由切換黑白畫面，雖然說按 <kbd className="font-bold px-1.5 py-0.5 border mx-0.5 inline-block">Ctrl + T</kbd> 更快 (? 
              </p>

              <p className="pt-1">
                迷路時也別擔心，按一下 <kbd className="font-bold px-1.5 py-0.5 border mx-0.5 inline-block">Esc</kbd> 就能一秒回到輸入欄啦 (๑•̀ㅂ•́)و✧
              </p>
            </div>

            {/* Bottom Letter Footer / Divider */}
            <div className="pt-6 border-t mt-6 flex justify-between items-center text-xs opacity-50">
              <span>END OF LETTER</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
