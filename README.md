<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="icon" type="image/png" href="ma_hacker_favicon.png">
    <title>Mahacker Master Planer</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        /* --- CSS Variables --- */
        :root {
            --bg-body: #F9F9F9;
            --bg-main: #FFFFFF;
            --bg-header: #FFFFFF;
            --bg-control-bar: #FDFDFD;
            --bg-week-header: #F9FAFB;
            --border-color: #E5E7EB;
            
            --text-primary: #111827; 
            --text-secondary: #6B7280;
            --text-date-default: #37352F;
            
            --bg-sidebar: #FFFFFF;
            --sidebar-text-primary: #37352F;
            --sidebar-text-secondary: #6B7280;
            --sidebar-input-bg: #F3F4F6;
            --search-dropdown-bg: #FFFFFF;
            
            --grid-line: #E5E7EB;
            --day-bg-hover: #FAFAFA;
            --day-bg-disabled: #F9FAFB;
        }

        body.dark-mode {
            --bg-body: #1E1E1E;
            --bg-main: #1E1E1E;
            --bg-header: #2C2C2C;
            --bg-control-bar: #252525;
            --bg-week-header: #252525;
            --border-color: #444444;
            --text-primary: #ECECEC;
            --text-secondary: #A0A0A0;
            --text-date-default: #ECECEC;
            
            --bg-sidebar: #2C2C2C;
            --sidebar-text-primary: #ECECEC;
            --sidebar-text-secondary: #A0A0A0;
            --sidebar-input-bg: #373737;
            --search-dropdown-bg: #2C2C2C;
            
            --grid-line: #333333;
            --day-bg-hover: #252525;
            --day-bg-disabled: #181818;
        }

        body { font-family: 'Inter', sans-serif; background-color: var(--bg-body); color: var(--text-primary); transition: background-color 0.3s ease; overflow: hidden; }
        
        .app-container { display: flex; height: 100vh; width: 100vw; overflow: hidden; flex-direction: row; }

        /* Sidebar */
        aside { 
            background-color: var(--bg-sidebar); 
            border-right: 1px solid var(--border-color); 
            transition: background-color 0.3s;
            display: flex; flex-direction: column;
            position: relative;
            z-index: 30;
        }

        .sidebar-resizer {
            width: 5px; cursor: col-resize; position: absolute; top: 0; right: 0; bottom: 0;
            z-index: 100; opacity: 0; transition: opacity 0.2s;
        }
        aside:hover .sidebar-resizer { opacity: 1; background: rgba(0,0,0,0.1); }

        /* --- Mobile Styles --- */
        @media (max-width: 768px) {
            .app-container { flex-direction: column; }
            main { flex: 1; overflow-y: auto; padding-bottom: 220px; }

            aside {
                position: fixed;
                bottom: 0; left: 0; right: 0;
                width: 100% !important; 
                height: 85vh; 
                border-right: none;
                border-top: 1px solid var(--border-color);
                border-top-left-radius: 24px;
                border-top-right-radius: 24px;
                box-shadow: 0 -10px 40px rgba(0,0,0,0.15);
                transform: translateY(calc(100% - 180px)); 
                transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
            }
            
            aside.sheet-open { transform: translateY(0); }
            .sidebar-resizer { display: none; }
            
            /* Minimal Mobile Button */
            .mobile-toggle-text-btn {
                display: block !important;
                width: 80px;
                margin: 0 auto;
                text-align: center;
                padding: 6px 0;
                font-size: 11px;
                font-weight: 600;
                color: var(--text-secondary);
                background: transparent;
                border: 1px solid var(--border-color);
                border-radius: 12px;
                margin-top: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .mobile-toggle-text-btn:active { 
                background-color: rgba(0,0,0,0.05);
                transform: scale(0.95); 
            }
            body.dark-mode .mobile-toggle-text-btn:active {
                background-color: rgba(255,255,255,0.1);
            }
            
            .sheet-content { overflow-y: auto; padding-bottom: 40px; }
        }

        @media (min-width: 769px) {
            .mobile-toggle-text-btn { display: none !important; }
            .sheet-content { flex: 1; overflow-y: auto; }
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
        body.dark-mode ::-webkit-scrollbar-thumb { background: #4B5563; }

        /* Calendar */
        .week-row { display: flex; position: relative; min-height: 120px; border-bottom: 1px solid var(--grid-line); }
        .day-bg { flex: 1; border-right: 1px solid var(--grid-line); padding: 6px; background-color: var(--bg-main); position: relative; }
        .day-bg.disabled-month { background-color: var(--day-bg-disabled); }
        .date-num { 
            font-size: 13px; font-weight: 600; margin-bottom: 4px; color: var(--text-date-default); 
            width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
            border-radius: 50%; transition: all 0.3s ease;
        }

        /* Animations */
        @keyframes soft-pulse {
            0% { transform: scale(1); background-color: transparent; }
            50% { transform: scale(1.6); background-color: rgba(59, 130, 246, 0.2); color: #2563EB; font-weight: 800; }
            100% { transform: scale(1); background-color: transparent; }
        }
        .animate-today { animation: soft-pulse 0.8s ease-in-out; }
        
        @keyframes green-glow-shadow {
            0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
            50% { box-shadow: inset 0 0 0 2px rgba(34, 197, 94, 1), 0 0 8px rgba(34, 197, 94, 0.4); } 
            100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .event-highlighted {
            animation: green-glow-shadow 2s ease-in-out infinite;
            z-index: 100 !important;
            box-sizing: border-box;
        }

        /* Event Bars */
        .events-layer { position: absolute; top: 28px; left: 0; right: 0; bottom: 0; pointer-events: none; display: flex; flex-direction: column; gap: 2px; padding-bottom: 4px; }
        .event-bar {
            height: 20px; font-size: 11px; line-height: 20px; padding: 0 6px; border-radius: 3px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; position: absolute;
            cursor: pointer; pointer-events: auto; font-weight: 500; z-index: 10;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s;
            box-sizing: border-box; border: 1px solid transparent; 
        }
        .event-bar:hover { 
            z-index: 50; opacity: 1; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.15); 
            filter: brightness(0.95);
        }
        .event-bar.dimmed { opacity: 0.2; }
        .event-bar.mobile-expanded {
            height: auto !important; white-space: normal !important; z-index: 100 !important;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2) !important; padding: 6px 8px;
        }

        /* Colors - Semi-Transparent Backgrounds (0.75 Opacity) */
        .bg-red-soft { background-color: rgba(255, 220, 224, 0.75); color: #4E0A0E; }
        .bg-blue-soft { background-color: rgba(211, 229, 239, 0.75); color: #183347; }
        .bg-green-soft { background-color: rgba(219, 237, 219, 0.75); color: #1C3829; }
        .bg-yellow-soft { background-color: rgba(253, 236, 200, 0.75); color: #402C1B; }
        .bg-purple-soft { background-color: rgba(232, 222, 238, 0.75); color: #412454; }
        .bg-gray-soft { background-color: rgba(241, 241, 239, 0.75); color: #37352F; }
        .bg-pink-soft { background-color: rgba(245, 224, 233, 0.75); color: #4C2337; }
        .bg-orange-soft { background-color: rgba(255, 237, 213, 0.75); color: #7C2D12; }
        .bg-teal-soft { background-color: rgba(204, 251, 241, 0.75); color: #0F766E; }
        .bg-indigo-soft { background-color: rgba(224, 231, 255, 0.75); color: #3730A3; }

        .rounded-l-none { border-top-left-radius: 0; border-bottom-left-radius: 0; margin-left: -1px;}
        .rounded-r-none { border-top-right-radius: 0; border-bottom-right-radius: 0; margin-right: -1px;}
        .text-holiday { color: #E03E3E !important; }
        .text-sat { color: #3B82F6 !important; }
        
        /* Dark Mode (70% Opacity Background, BUT Dark Text) */
        body.dark-mode .bg-red-soft { background-color: rgba(255, 220, 224, 0.7); color: #4E0A0E; }
        body.dark-mode .bg-blue-soft { background-color: rgba(211, 229, 239, 0.7); color: #183347; }
        body.dark-mode .bg-green-soft { background-color: rgba(219, 237, 219, 0.7); color: #1C3829; }
        body.dark-mode .bg-yellow-soft { background-color: rgba(253, 236, 200, 0.7); color: #402C1B; }
        body.dark-mode .bg-purple-soft { background-color: rgba(232, 222, 238, 0.7); color: #412454; }
        body.dark-mode .bg-gray-soft { background-color: rgba(241, 241, 239, 0.7); color: #37352F; }
        body.dark-mode .bg-pink-soft { background-color: rgba(245, 224, 233, 0.7); color: #4C2337; }
        body.dark-mode .bg-orange-soft { background-color: rgba(255, 237, 213, 0.7); color: #7C2D12; }
        body.dark-mode .bg-teal-soft { background-color: rgba(204, 251, 241, 0.7); color: #0F766E; }
        body.dark-mode .bg-indigo-soft { background-color: rgba(224, 231, 255, 0.7); color: #3730A3; }


        /* Sidebar Elements */
        .insight-box { background: rgba(0,0,0,0.03); border-radius: 8px; padding: 12px; margin-bottom: 12px; border: 1px solid var(--border-color); }
        body.dark-mode .insight-box { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
        .insight-tag { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px; text-transform: uppercase; }
        .tag-core { background: #E0F2FE; color: #0369A1; }
        .tag-hyper { background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%); color: white; border: none; }
        .keyword-chip { display: inline-block; font-size: 11px; padding: 2px 6px; background: rgba(0,0,0,0.05); border-radius: 4px; margin: 2px 2px 0 0; color: var(--text-primary); }
        body.dark-mode .keyword-chip { background: rgba(255,255,255,0.15); }

        .sidebar-input {
            background-color: var(--sidebar-input-bg); color: var(--sidebar-text-primary);
            border: 1px solid transparent; transition: all 0.2s;
        }
        .sidebar-input:focus { background-color: var(--bg-main); border-color: #3B82F6; outline: none; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
        
        .search-dropdown { background-color: #FFFFFF; border: 1px solid #E5E7EB; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        body.dark-mode .search-dropdown { background-color: #2C2C2C; border-color: #444444; }
        .search-item:hover, .search-item.keyboard-selected { background-color: #F3F4F6; }
        body.dark-mode .search-item:hover, body.dark-mode .search-item.keyboard-selected { background-color: #373737; }
        .search-result-title { color: #000000 !important; }
        .search-result-date { color: #4B5563 !important; } 
        body.dark-mode .search-result-title { color: #FFFFFF !important; }
        body.dark-mode .search-result-date { color: #9CA3AF !important; }

        .clock-widget { font-variant-numeric: tabular-nums; letter-spacing: -0.5px; }

        /* Buttons */
        .custom-btn { transition: all 0.3s; position: relative; overflow: hidden; }
        .custom-btn:hover { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .btn-insta { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color: white; }
        .btn-blog { background-color: #6B7280; color: white; }
        body.dark-mode .btn-blog { background-color: #4B5563; }
        .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        #hyperModeContent { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.5s ease-in-out, opacity 0.4s ease-in-out; }
        #hyperModeContent.active { max-height: 2000px; opacity: 1; }
        .hyper-btn { background: linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%); color: white; transition: all 0.3s; }
        .hyper-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .hyper-btn.active { background: linear-gradient(90deg, #EF4444 0%, #F59E0B 100%); box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); }
        /* 타이틀 색상 전용 스타일 */
        .main-title { color: #3f3f3f; }
        body.dark-mode .main-title { color: #ffffff; }
    </style>
</head>
<body class="overflow-hidden">

<div class="app-container">
    <aside id="sidebar" class="w-[400px] min-w-[300px] max-w-[500px]">
        <div class="sidebar-resizer" id="resizer"></div>
        
        <button id="mobileUpBtn" class="mobile-toggle-text-btn">
            UP ▲
        </button>

        <div class="p-5 pb-2 border-b border-transparent md:border-[var(--border-color)]">
            <div class="hidden md:block">
                <h1 class="font-bold text-2xl tracking-tight" style="color: var(--sidebar-text-primary)">2026 Master Plan</h1>
                <p class="text-xs mt-1" style="color: var(--sidebar-text-secondary)">마케팅 이슈 통합 캘린더</p>
                <div class="mt-4 flex items-center justify-between text-xs font-medium px-3 py-2 rounded-lg bg-[var(--sidebar-input-bg)]">
                    <span style="color: var(--sidebar-text-secondary)">Today</span>
                    <span id="realTimeClock" class="clock-widget" style="color: var(--sidebar-text-primary)"></span>
                </div>
            </div>

            <div class="relative mt-2 md:mt-4 group z-50">
                <div class="relative">
                    <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input type="text" id="eventSearch" placeholder="일정 검색 (클릭하여 이동)" 
                        class="sidebar-input w-full pl-9 pr-3 py-2 rounded-md text-sm placeholder-gray-400">
                </div>
                <div id="searchResults" class="hidden absolute left-0 right-0 bottom-full mb-1 md:bottom-auto md:top-full md:mt-1 search-dropdown rounded-md max-h-60 overflow-y-auto z-50">
                    </div>
            </div>

            <button id="hyperToggleBtn" class="hyper-btn w-full mt-3 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm">
                <span>하이퍼 모드 🔥 OFF</span>
            </button>
        </div>
        
        <div class="sheet-content p-4">
            <div id="standardInsightContainer"></div>
            <div id="hyperModeContent" class="space-y-3 pt-2"></div>

            <div class="mt-6 space-y-2">
                <a href="https://www.instagram.com/ma_hacker.official/" target="_blank" class="custom-btn btn-insta w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    마케팅 인스타그램 바로가기
                </a>
                <a href="https://marketking.tistory.com/" target="_blank" class="custom-btn btn-blog w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
                    마케팅 블로그 바로가기
                </a>
            </div>

            <div class="mt-6 pt-6 border-t border-[var(--border-color)]">
                <h3 class="text-[10px] font-bold uppercase tracking-wider mb-2" style="color: var(--sidebar-text-secondary)">Legend</h3>
                <div class="grid grid-cols-2 gap-y-1 gap-x-2 text-xs">
                    <div class="flex items-center text-gray-500"><span class="w-2 h-2 rounded bg-[#FFDCE0] mr-1.5"></span>공휴일/시즌</div>
                    <div class="flex items-center text-gray-500"><span class="w-2 h-2 rounded bg-[#D3E5EF] mr-1.5"></span>스포츠</div>
                    <div class="flex items-center text-gray-500"><span class="w-2 h-2 rounded bg-[#E8DEEE] mr-1.5"></span>엔터/축제</div>
                    <div class="flex items-center text-gray-500"><span class="w-2 h-2 rounded bg-[#DBEDDB] mr-1.5"></span>이색기념일</div>
                    <div class="flex items-center text-gray-500"><span class="w-2 h-2 rounded bg-[#E0E7FF] mr-1.5"></span>마케팅/컨퍼런스</div>
                </div>
            </div>
        </div>

        <div class="p-3 border-t border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-sidebar)] md:bg-transparent">
             <span class="text-xs font-medium" style="color: var(--sidebar-text-secondary)">다크 모드</span>
             <input type="checkbox" id="darkModeToggle" class="accent-gray-800 w-4 h-4 cursor-pointer">
        </div>
    </aside>

    <main class="flex-1 flex flex-col h-full relative" style="background-color: var(--bg-body)">
        
        <div class="w-full bg-[var(--bg-header)] border-b border-[var(--border-color)] py-2 flex flex-col items-center justify-center shrink-0 z-20 relative">
            <h1 class="main-title text-xs md:text-xs tracking-wider uppercase leading-tight">
                2026 marketing master plan projct by.mahacker
            </h1>
        </div>

        <div class="w-full px-4 py-2 md:py-3 flex items-center justify-between border-b border-[var(--border-color)] shrink-0 z-10" style="background-color: var(--bg-control-bar)">
            <div class="flex bg-gray-100/50 dark:bg-white/10 rounded-md p-0.5 border border-[var(--border-color)]">
                <button id="prevMonth" class="nav-btn px-3 py-1.5 hover:bg-white dark:hover:bg-gray-600 rounded shadow-sm transition font-medium text-sm" style="color: var(--text-primary)">◀</button>
                <button id="nextMonth" class="nav-btn px-3 py-1.5 hover:bg-white dark:hover:bg-gray-600 rounded shadow-sm transition font-medium text-sm" style="color: var(--text-primary)">▶</button>
            </div>

            <h2 id="currentDateDisplay" class="text-lg md:text-2xl font-bold tracking-tight text-[var(--text-primary)]">2026년 1월</h2>

            <button onclick="goToToday()" class="px-3 py-1.5 text-xs md:text-sm font-medium border border-[var(--border-color)] rounded hover:bg-black/5 transition text-[var(--text-primary)]">Today</button>
        </div>

        <div class="grid grid-cols-7 border-b border-[var(--border-color)]" style="background-color: var(--bg-week-header)">
            <div class="py-2 text-center text-xs font-bold text-red-500 uppercase">Sun</div>
            <div class="py-2 text-center text-xs font-bold uppercase" style="color: var(--text-secondary)">Mon</div>
            <div class="py-2 text-center text-xs font-bold uppercase" style="color: var(--text-secondary)">Tue</div>
            <div class="py-2 text-center text-xs font-bold uppercase" style="color: var(--text-secondary)">Wed</div>
            <div class="py-2 text-center text-xs font-bold uppercase" style="color: var(--text-secondary)">Thu</div>
            <div class="py-2 text-center text-xs font-bold uppercase" style="color: var(--text-secondary)">Fri</div>
            <div class="py-2 text-center text-xs font-bold text-blue-500 uppercase">Sat</div>
        </div>

        <div class="flex-1 overflow-y-auto relative">
            <div id="calendar" class="flex flex-col border-l border-[var(--border-color)]" style="background-color: var(--bg-main)">
                </div>
        </div>
    </main>
</div>

    <script>
        // --- Data & Utils ---
        const monthlyInsights = {
            1: { theme: "갓생 시작, 겨울방학, 연말정산", seasonLabel: "연말정산 시즌 | 겨울방학 시즌", keywords: ["#병오년", "#새해다짐", "#신년운세", "#해외여행", "#새해이벤트", "#명절선물", "#연말정산"], eat: "제철(딸기), 떡국/만두(새해), 건강식품", buy: "다이어리, 새해 선물, 겨울 보습템, 가전(졸업/입학)", play: "새해 일출 명소, 겨울 축제(산천어/송어), 실내 쇼핑몰", do: "어학 공부 시작, 신년 운세 앱, 헬스장 등록" },
            2: { theme: "동계올림픽, 졸업/입학, 밸런타인", seasonLabel: "졸업 시즌 | 신입생 입학 준비", keywords: ["#팀코리아", "#졸업시즌", "#신입생", "#초콜릿", "#겨울마지막"], eat: "초콜릿(수제/브랜드), 오곡밥/부럼(정월대보름)", buy: "졸업/입학 선물(노트북/태블릿), 봄 신상 의류, 향수", play: "동계올림픽 응원, 졸업식 포토존, 스키장 막바지", do: "수강신청, 자취방 구하기, OT/새터 준비" },
            3: { theme: "캠퍼스 개강, 야구 개막, 벚꽃", seasonLabel: "이사 시즌 | 결혼 시즌 | 봄맞이", keywords: ["#프로야구개막", "#화이트데이", "#미세먼지", "#벚꽃명소", "#개강총회"], eat: "삼겹살(3.3), 사탕/디저트, 봄나물", buy: "개강룩, 청소/인테리어 용품, 화이트닝 뷰티템, 미세먼지 마스크", play: "벚꽃 놀이, 야구 직관, 서울마라톤", do: "동아리 가입, 이사/혼수 준비" },
            4: { theme: "중간고사, 피크닉, 힙한 박람회", seasonLabel: "결혼 시즌 | 봄 나들이", keywords: ["#피크닉", "#만우절", "#지구의날", "#중간고사", "#하객룩"], eat: "에너지드링크(시험), 샌드위치/도시락(피크닉)", buy: "캠핑 용품, 등산복, 하객룩(원피스/정장), 선케어", play: "한강 피크닉, 뮤직 페스티벌, 꽃놀이 막바지", do: "중간고사 공부, 투표(지방선거 사전 분위기)" },
            5: { theme: "가정의 달, 대학 축제, 선물 대목", seasonLabel: "야외 페스티벌 시즌 | 결혼 시즌", keywords: ["#어린이날", "#어버이날", "#스승의날", "#성년의날", "#선물하기"], eat: "외식(가족모임), 카네이션 케이크, 주류(축제)", buy: "용돈박스, 안마기, 장난감, 향수(성년의날), 여름 옷 준비", play: "대학 축제(대동제), 놀이공원, 뮤직 페스티벌(뷰민라/서재페)", do: "종합소득세 신고, 감사 편지 쓰기" },
            6: { theme: "월드컵 개막, 종강, 여름 준비", seasonLabel: "여름 휴가 준비 | 페스티벌 시즌", keywords: ["#월드컵응원", "#지방선거", "#제로웨이스트", "#종강", "#다이어트"], eat: "치맥(월드컵/야구), 냉면/콩국수, 수박", buy: "제습기, 선글라스, 레인부츠, 다이어트 보조제, 수영복", play: "월드컵 거리응원, 워터밤, 기말고사 해방", do: "여름 휴가 계획, 다이어트 돌입, 투표" },
            7: { theme: "본격 바캉스, 복날 보양식, 페어", seasonLabel: "여름 휴가 시즌 | 락 페스티벌 시즌", keywords: ["#여름대비", "#초복", "#중복", "#물놀이", "#여름방학"], eat: "삼계탕/장어(보양식), 빙수, 아이스크림", buy: "여행용 캐리어, 쿨링 화장품, 휴대용 선풍기, 물놀이 용품", play: "서일페, 여름 휴가, 호캉스, 락 페스티벌", do: "부가세 신고, 방학 알바, 내일로 여행" },
            8: { theme: "수능 D-100, 늦캉스, 광복절", seasonLabel: "여름 휴가 시즌 | 하반기 공채 준비", keywords: ["#열대야", "#백캉스", "#몰캉스", "#말복", "#수능응원"], eat: "치킨(말복/축구), 시원한 음료", buy: "수능 응원 선물(떡/엿), 가을 신상(얼리버드), 캠핑 의자", play: "게임스컴, 실내 쇼핑몰(몰캉스), 늦은 휴가", do: "2학기 수강신청, 하반기 취업 준비" },
            9: { theme: "아시안게임, 추석, 가을 시작", seasonLabel: "추석 선물 시즌 | 가을 캠핑", keywords: ["#명절선물", "#가을캠핑", "#개강", "#독서", "#아시안게임"], eat: "송편/전(추석), 대하/전어, 전통 디저트(약과)", buy: "추석 선물세트, 한복, 등산복/바람막이, 탈모 케어", play: "아시안게임 응원, 가을 등산, 핑크뮬리 명소", do: "성묘/벌초, 대졸 공채 지원" },
            10: { theme: "롤드컵, 할로윈, 단풍놀이", seasonLabel: "가을 축제 시즌 | 결혼/이사 시즌", keywords: ["#가을야구", "#단풍놀이", "#할로윈", "#지역축제", "#중간고사"], eat: "와인/치즈, 호박 파이, 따뜻한 라떼", buy: "할로윈 코스튬, 가을 침구/러그, 보습 크림", play: "불꽃축제, 단풍놀이, 롤드컵 직관/응원, 할로윈 파티", do: "중간고사, 독서(문화의달)" },
            11: { theme: "수능, 쇼핑 대목(블프/빼빼로)", seasonLabel: "쇼핑 시즌 | 월동 준비", keywords: ["#수능응원", "#수험생할인", "#블랙프라이데이", "#김장철", "#빼빼로데이"], eat: "빼빼로, 수육/김장김치, 붕어빵/호빵", buy: "패딩/코트, 김치통/고무장갑, 온수매트, 직구(블프)", play: "지스타, 수험표 할인 놀이공원/영화관", do: "수능 시험, 김장, 겨울 옷 정리" },
            12: { theme: "홀리데이, 연말 파티, 다이어리", seasonLabel: "크리스마스 시즌 | 송년회 시즌", keywords: ["#홀리데이", "#겨울방학", "#송년회", "#선물하기", "#연말정산"], eat: "크리스마스 케이크, 홈파티 음식, 슈톨렌, 뱅쇼", buy: "2027 다이어리, 크리스마스 트리, 연말 감사 선물, 목도리/장갑", play: "연말 콘서트, 시상식 시청, 해돋이 여행 예약", do: "연말정산 미리보기, 새해 목표 세우기, 송년회" }
        };

        const rawEvents = [
            // 1월 (JAN)
            { start: '2026-01-01', end: '2026-01-01', title: '🌅 새해 첫날 (신정)', type: 'holiday', color: 'bg-red-soft' },
            { start: '2026-01-01', end: '2026-01-01', title: '🏃 새해 일출런', type: 'sport', color: 'bg-blue-soft' },
            { start: '2026-01-02', end: '2026-01-02', title: '😶 세계 내향인의 날', type: 'anniversary', color: 'bg-green-soft' },
            { start: '2026-01-06', end: '2026-01-09', title: '💻 CES 2026 (라스베가스)', type: 'business', color: 'bg-indigo-soft' },
            { start: '2026-01-06', end: '2026-01-24', title: '⚽ AFC U-23 아시안컵', type: 'sport', color: 'bg-blue-soft' },
            { start: '2026-01-11', end: '2026-01-11', title: '🏆 골든글로브 시상식', type: 'culture', color: 'bg-purple-soft' },
            { start: '2026-01-12', end: '2026-01-25', title: '🎾 호주오픈 테니스', type: 'sport', color: 'bg-blue-soft' },
            { start: '2026-01-14', end: '2026-01-14', title: '📔 다이어리데이', type: 'anniversary', color: 'bg-green-soft' },
            { start: '2026-01-16', end: '2026-01-18', title: '🐈 가낳지모 캣페어', type: 'culture', color: 'bg-purple-soft' },
            { start: '2026-01-22', end: '2026-01-25', title: '☕ 카페&디저트페어', type: 'culture', color: 'bg-purple-soft' },
            { start: '2026-01-29', end: '2026-02-01', title: '🎨 K-일러스트레이션페어', type: 'culture', color: 'bg-purple-soft' },

            // 2월 (FEB)
            { start: '2026-02-02', end: '2026-02-02', title: '🌿 세계 습지의 날', type: 'anniversary', color: 'bg-green-soft' },
            { start: '2026-02-03', end: '2026-02-08', title: '👗 2026 F/W 서울패션위크', type: 'business', color: 'bg-indigo-soft' },
            { start: '2026-02-04', end: '2026-02-04', title: '🌱 입춘', type: 'season', color: 'bg-yellow-soft' },
            { start: '2026-02-06', end: '2026-02-22', title: '⛸️ 밀라노 동계올림픽', type: 'sport', color: 'bg-blue-soft' },
            { start: '2026-02-11', end: '2026-02-11', title: '🍓 딸기의 날', type: 'anniversary', color: 'bg-pink-soft' },
            { start: '2026-02-12', end: '2026-02-22', title: '🎬 베를린 국제영화제', type: 'culture', color: 'bg-purple-soft' },
            { start: '2026-02-14', end: '2026-02-14', title: '🍫 밸런타인데이', type: 'anniversary', color: 'bg-pink-soft' },
            { start: '2026-02-16', end: '2026-02-18', title: '🇰🇷 설날 연휴', type: 'holiday', color: 'bg-red-soft' },
            { start: '2026-02-25', end: '2026-03-01', title: '🏠 서울리빙디자인페어', type: 'culture', color: 'bg-purple-soft' },
            { start: '2026-02-27', end: '2026-02-27', title: '🐻‍❄️ 국제 북극곰의 날', type: 'anniversary', color: 'bg-teal-soft' },
            { start: '2026-02-28', end: '2026-02-28', title: '🧬 세계 희귀질환의 날', type: 'anniversary', color: 'bg-gray-soft' },

            // 3월 (MAR)
            { start: '2026-03-01', end: '2026-03-01', title: '🇰🇷 삼일절 / 🇯🇵 도쿄마라톤', type: 'holiday', color: 'bg-red-soft' },
            { start: '2026-03-02', end: '2026-03-05', title: '📱 MWC 2026 (바르셀로나)', type: 'business', color: 'bg-indigo-soft' },
            { start: '2026-03-03', end: '2026-03-03', title: '🌕 정월대보름 / 🥓 삼겹살데이', type: 'anniversary', color: 'bg-green-soft' },
            { start: '2026-03-05', end: '2026-03-05', title: '🐸 경칩', type: 'season', color: 'bg-yellow-soft' },
            { start: '2026-03-05', end: '2026-03-17', title: '⚾ WBC (야구 월드컵)', type: 'sport', color: 'bg-blue-soft' },
            { start: '2026-03-08', end: '2026-03-08', title: '🏈 슈퍼볼 LX (미국)', type: 'sport', color: 'bg-blue-soft' },
            { start: '2026-03-08', end: '2026-03-08', title: '👩 세계 여성의 날', type: 'anniversary', color: 'bg-pink-soft' },
            { start: '2026-03-14', end: '2026-03-14', title: '🍭 화이트데이', type: 'anniversary', color: 'bg-pink-soft' },
            { start: '2026-03-15', end: '2026-03-15', title: '🏆 아카데미 시상식 / 🏃 서울마라톤', type: 'culture', color: 'bg-purple-soft' },
            { start: '2026-03-16', end: '2026-03-16', title: '🐼 세계 판다의 날', type: 'anniversary', color: 'bg-teal-soft' },
            { start: '2026-03-20', end: '2026-03-20', title: '🎮 붉은사막 출시(예정)', type: 'culture', color: 'bg-indigo-soft' },
            { start: '2026-03-22', end: '2026-03-22', title: '💧 세계 물의 날', type: 'anniversary', color: 'bg-blue-soft' },
            { start: '2026-03-23', end: '2026-03-23', title: '🐶 국제 강아지의 날', type: 'anniversary', color: 'bg-orange-soft' },
            { start: '2026-03-27', end: '2026-03-27', title: '⚓ 서해수호의 날', type: 'holiday', color: 'bg-gray-soft' },
            { start: '2026-03-28', end: '2026-03-28', title: '⚾ KBO 정규시즌 개막', type: 'sport', color: 'bg-blue-soft' },

            // 4월 (APR)
            { start: '2026-04-01', end: '2026-04-01', title: '🃏 만우절', type: 'anniversary', color: 'bg-purple-soft' },
            { start: '2026-04-03', end: '2026-04-03', title: '🇰🇷 예비군의 날', type: 'anniversary', color: 'bg-gray-soft' },
            { start: '2026-04-05', end: '2026-04-05', title: '🌳 식목일 / 🥚 부활절', type: 'anniversary', color: 'bg-green-soft' },
            { start: '2026-04-07', end: '2026-04-07', title: '🏥 보건의 날', type: 'anniversary', color: 'bg-gray-soft' },
            { start: '2026-04-09', end: '2026-04-09', title: '🎧 ASMR의 날', type: 'anniversary', color: 'bg-gray-soft' },
            { start: '2026-04-09', end: '2026-04-12', title: '⛳ 마스터스 골프', type: 'sport', color: 'bg-blue-soft' },
            { start: '2026-04-10', end: '2026-04-19', title: '🎵 코첼라 페스티벌', type: 'culture', color: 'bg-purple-soft' },
            { start: '2026-04-14', end: '2026-04-14', title: '🍜 블랙데이', type: 'anniversary', color: 'bg-gray-soft' },
            { start: '2026-04-16', end: '2026-04-16', title: '🎗️ 국민안전의 날', type: 'anniversary', color: 'bg-yellow-soft' },
            { start: '2026-04-16', end: '2026-04-19', title: '🙏 서울국제불교박람회', type: 'culture', color: 'bg-purple-soft' },
            { start: '2026-04-20', end: '2026-04-20', title: '♿ 장애인의 날 / 보스턴 마라톤', type: 'anniversary', color: 'bg-green-soft' },
            { start: '2026-04-22', end: '2026-04-22', title: '🌍 지구의 날', type: 'anniversary', color: 'bg-green-soft' },
            { start: '2026-04-23', end: '2026-04-23', title: '📚 세계 책의 날', type: 'anniversary', color: 'bg-blue-soft' },
            { start: '2026-04-28', end: '2026-04-28', title: '⚔️ 충무공 탄신일', type: 'holiday', color: 'bg-gray-soft' },
            { start: '2026-04-29', end: '2026-05-08', title: '🎬 전주국제영화제', type: 'culture', color: 'bg-purple-soft' },

            // 5월 (MAY)
            { start: '2026-05-01', end: '2026-05-01', title: '👷 근로자의 날', type: 'holiday', color: 'bg-red-soft' },
            { start: '2026-05-03', end: '2026-05-03', title: '🐕 진돗개의 날', type: 'anniversary', color: 'bg-orange-soft' },
            { start: '2026-05-05', end: '2026-05-05', title: '🎈 어린이날', type: 'holiday', color: 'bg-red-soft' },
            { start: '2026-05-06', end: '2026-05-08', title: '🤖 AI 엑스포 코리아', type: 'business', color: 'bg-indigo-soft' },
            { start: '2026-05-08', end: '2026-05-08', title: '🌺 어버이날', type: 'anniversary', color: 'bg-pink-soft' },
            { start: '2026-05-10', end: '2026-05-10', title: '🗳️ 유권자의 날', type: 'anniversary', color: 'bg-gray-soft' },
            { start: '2026-05-12', end: '2026-05-23', title: '🎬 칸 영화제', type: 'culture', color: 'bg-purple-soft' },
            { start: '2026-05-12', end: '2026-05-12', title: '💉 국제 간호사의 날', type: 'anniversary', color: 'bg-teal-soft' },
            { start: '2026-05-14', end: '2026-05-14', title: '🌹 로즈데이', type: 'anniversary', color: 'bg-red-soft' },
            { start: '2026-05-15', end: '2026-05-15', title: '🏫 스승의 날 / 세종대왕 나신 날', type: 'anniversary', color: 'bg-green-soft' },
            { start: '2026-05-18', end: '2026-05-18', title: '🌹 성년의 날 / 5.18 민주화운동', type: 'anniversary', color: 'bg-pink-soft' },
            { start: '2026-05-21', end: '2026-05-21', title: '💑 부부의 날', type: 'anniversary', color: 'bg-pink-soft' },
            { start: '2026-05-22', end: '2026-05-24', title: '🎷 서울재즈페스티벌', type: 'culture', color: 'bg-purple-soft' },
            { start: '2026-05-22', end: '2026-05-22', title: '🌿 생물다양성의 날', type: 'anniversary', color: 'bg-green-soft' },
            { start: '2026-05-24', end: '2026-05-24', title: '🏮 부처님 오신 날', type: 'holiday', color: 'bg-red-soft' },
            { start: '2026-05-27', end: '2026-05-27', title: '🚀 우주항공의 날', type: 'anniversary', color: 'bg-blue-soft' },
            { start: '2026-05-31', end: '2026-05-31', title: '🌊 바다의 날', type: 'anniversary', color: 'bg-blue-soft' },

            // 6월 (JUN)
            { start: '2026-06-01', end: '2026-06-01', title: '🥛 세계 우유의 날', type: 'anniversary', color: 'bg-gray-soft' },
            { start: '2026-06-03', end: '2026-06-03', title: '🗳️ 지방선거', type: 'holiday', color: 'bg-red-soft' },
            { start: '2026-06-05', end: '2026-06-05', title: '🌿 세계 환경의 날', type: 'anniversary', color: 'bg-green-soft' },
            { start: '2026-06-06', end: '2026-06-06', title: '🇰🇷 현충일', type: 'holiday', color: 'bg-red-soft' },
            { start: '2026-06-11', end: '2026-07-19', title: '⚽ 2026 북중미 월드컵', type: 'sport', color: 'bg-blue-soft' },
            { start: '2026-06-14', end: '2026-06-14', title: '💋 키스데이 / 🩸 헌혈자의 날', type: 'anniversary', color: 'bg-pink-soft' },
            { start: '2026-06-19', end: '2026-06-19', title: '🚿 단오', type: 'season', color: 'bg-yellow-soft' },
            { start: '2026-06-20', end: '2026-06-20', title: '😊 1년 중 가장 행복한 날', type: 'anniversary', color: 'bg-yellow-soft' },
            { start: '2026-06-22', end: '2026-06-26', title: '🦁 칸 라이언즈 광고제', type: 'business', color: 'bg-indigo-soft' },
            { start: '2026-06-24', end: '2026-06-28', title: '📚 서울국제도서전', type: 'culture', color: 'bg-purple-soft' },
            { start: '2026-06-25', end: '2026-06-25', title: '🇰🇷 6.25 전쟁일', type: 'holiday', color: 'bg-gray-soft' },
            { start: '2026-06-26', end: '2026-06-26', title: '🚫 마약 퇴치의 날', type: 'anniversary', color: 'bg-gray-soft' },
            { start: '2026-06-28', end: '2026-06-28', title: '🚂 철도의 날', type: 'anniversary', color: 'bg-gray-soft' },
            { start: '2026-06-29', end: '2026-07-12', title: '🎾 윔블던 테니스', type: 'sport', color: 'bg-blue-soft' },

            // 7월 (JUL)
            { start: '2026-07-07', end: '2026-07-07', title: '🍫 세계 초콜릿의 날', type: 'anniversary', color: 'bg-orange-soft' },
            { start: '2026-07-08', end: '2026-07-08', title: '🔒 정보보호의 날', type: 'anniversary', color: 'bg-blue-soft' },
            { start: '2026-07-11', end: '2026-07-11', title: '⚾ KBO 올스타전 / 인구의 날', type: 'sport', color: 'bg-blue-soft' },
            { start: '2026-07-14', end: '2026-07-14', title: '💍 실버데이 / 북한이탈주민의 날', type: 'anniversary', color: 'bg-gray-soft' },
            { start: '2026-07-15', end: '2026-07-15', title: '🐔 초복', type: 'season', color: 'bg-yellow-soft' },
            { start: '2026-07-17', end: '2026-07-17', title: '🇰🇷 제헌절 / 😀 이모지 데이', type: 'holiday', color: 'bg-gray-soft' },
            { start: '2026-07-25', end: '2026-07-25', title: '🐔 중복', type: 'season', color: 'bg-yellow-soft' },
            { start: '2026-07-27', end: '2026-07-27', title: '🕊️ 유엔군 참전의 날', type: 'anniversary', color: 'bg-blue-soft' },
            { start: '2026-07-30', end: '2026-08-02', title: '🎨 서일페 V.21', type: 'culture', color: 'bg-purple-soft' },

            // 8월 (AUG)
            { start: '2026-08-07', end: '2026-08-07', title: '🍺 세계 맥주의 날 / 입추', type: 'anniversary', color: 'bg-orange-soft' },
            { start: '2026-08-08', end: '2026-08-08', title: '🐱 세계 고양이의 날', type: 'anniversary', color: 'bg-teal-soft' },
            { start: '2026-08-11', end: '2026-08-11', title: '💯 수능 D-100', type: 'anniversary', color: 'bg-red-soft' },
            { start: '2026-08-12', end: '2026-08-12', title: '👦 국제 청소년의 날', type: 'anniversary', color: 'bg-blue-soft' },
            { start: '2026-08-14', end: '2026-08-14', title: '🐔 말복 / 위안부 기림의 날', type: 'season', color: 'bg-yellow-soft' },
            { start: '2026-08-15', end: '2026-08-15', title: '🇰🇷 광복절', type: 'holiday', color: 'bg-red-soft' },
            { start: '2026-08-16', end: '2026-08-16', title: '⚽ EPL 개막', type: 'sport', color: 'bg-blue-soft' },
            { start: '2026-08-18', end: '2026-08-18', title: '🍚 쌀의 날', type: 'anniversary', color: 'bg-orange-soft' },
            { start: '2026-08-19', end: '2026-08-19', title: '📸 세계 사진의 날', type: 'anniversary', color: 'bg-gray-soft' },
            { start: '2026-08-23', end: '2026-08-23', title: '처서', type: 'season', color: 'bg-yellow-soft' },
            { start: '2026-08-26', end: '2026-08-26', title: '🐶 세계 강아지의 날', type: 'anniversary', color: 'bg-orange-soft' },
            { start: '2026-08-26', end: '2026-08-30', title: '🎮 게임스컴 2026 (독일)', type: 'culture', color: 'bg-purple-soft' },

            // 9월 (SEP)
            { start: '2026-09-02', end: '2026-09-12', title: '🎬 베니스 국제영화제', type: 'culture', color: 'bg-purple-soft' },
            { start: '2026-09-04', end: '2026-09-04', title: '🥋 태권도의 날 / 지식재산의 날', type: 'anniversary', color: 'bg-gray-soft' },
            { start: '2026-09-04', end: '2026-09-08', title: '💻 IFA 2026 (베를린)', type: 'business', color: 'bg-indigo-soft' },
            { start: '2026-09-07', end: '2026-09-07', title: '🐞 곤충의 날 / 푸른 하늘의 날', type: 'anniversary', color: 'bg-green-soft' },
            { start: '2026-09-09', end: '2026-09-09', title: '🐈 한국 고양이의 날', type: 'anniversary', color: 'bg-teal-soft' },
            { start: '2026-09-10', end: '2026-09-10', title: '🌊 해양경찰의 날 / 자살예방의 날', type: 'anniversary', color: 'bg-blue-soft' },
            { start: '2026-09-14', end: '2026-09-14', title: '📸 포토데이', type: 'anniversary', color: 'bg-gray-soft' },
            { start: '2026-09-17', end: '2026-09-17', title: '💌 고백데이 / 🦑 오징어게임의 날', type: 'anniversary', color: 'bg-pink-soft' },
            { start: '2026-09-18', end: '2026-09-18', title: '🍔 치즈버거의 날', type: 'anniversary', color: 'bg-orange-soft' },
            { start: '2026-09-19', end: '2026-09-19', title: '🏃 청년의 날 / 🏴‍☠️ 해적처럼 말하기', type: 'anniversary', color: 'bg-blue-soft' },
            { start: '2026-09-19', end: '2026-10-04', title: '🏅 나고야 아시안게임', type: 'sport', color: 'bg-blue-soft' },
            { start: '2026-09-21', end: '2026-09-21', title: '🧠 치매 극복의 날 / 평화의 날', type: 'anniversary', color: 'bg-green-soft' },
            { start: '2026-09-24', end: '2026-09-26', title: '🌕 추석 연휴', type: 'holiday', color: 'bg-red-soft' },
            { start: '2026-09-27', end: '2026-09-27', title: '🏃 베를린 마라톤', type: 'sport', color: 'bg-blue-soft' },

            // 10월 (OCT)
            { start: '2026-10-01', end: '2026-10-01', title: '🇰🇷 국군의 날 / ☕ 국제 커피의 날', type: 'holiday', color: 'bg-gray-soft' },
            { start: '2026-10-02', end: '2026-10-02', title: '😊 미소의 날 / 👴 노인의 날', type: 'anniversary', color: 'bg-yellow-soft' },
            { start: '2026-10-03', end: '2026-10-03', title: '🇰🇷 개천절', type: 'holiday', color: 'bg-red-soft' },
            { start: '2026-10-05', end: '2026-10-05', title: '세계 한인의 날', type: 'anniversary', color: 'bg-blue-soft' },
            { start: '2026-10-07', end: '2026-10-11', title: '📚 프랑크푸르트 도서전', type: 'culture', color: 'bg-purple-soft' },
            { start: '2026-10-09', end: '2026-10-09', title: '🇰🇷 한글날', type: 'holiday', color: 'bg-red-soft' },
            { start: '2026-10-10', end: '2026-10-10', title: '🤰 임산부의 날 / 🧠 정신건강의 날', type: 'anniversary', color: 'bg-pink-soft' },
            { start: '2026-10-14', end: '2026-10-14', title: '🍷 와인데이', type: 'anniversary', color: 'bg-red-soft' },
            { start: '2026-10-16', end: '2026-10-16', title: '🌾 세계 식량의 날', type: 'anniversary', color: 'bg-green-soft' },
            { start: '2026-10-21', end: '2026-10-21', title: '👮 경찰의 날', type: 'anniversary', color: 'bg-blue-soft' },
            { start: '2026-10-22', end: '2026-10-22', title: '👋 인사하는 날', type: 'anniversary', color: 'bg-teal-soft' },
            { start: '2026-10-24', end: '2026-10-24', title: '🍎 사과 데이 / 🇺🇳 유엔의 날', type: 'anniversary', color: 'bg-red-soft' },
            { start: '2026-10-25', end: '2026-10-25', title: '🏝️ 독도의 날', type: 'anniversary', color: 'bg-blue-soft' },
            { start: '2026-10-27', end: '2026-10-27', title: '💰 금융의 날 / 🐈 검은 고양이의 날', type: 'anniversary', color: 'bg-gray-soft' },
            { start: '2026-10-29', end: '2026-10-29', title: '지방자치의 날', type: 'anniversary', color: 'bg-gray-soft' },
            { start: '2026-10-31', end: '2026-10-31', title: '🎃 할로윈 데이', type: 'culture', color: 'bg-purple-soft' },

            // 11월 (NOV)
            { start: '2026-11-01', end: '2026-11-01', title: '🥩 한우 데이 / 🥗 비건의 날', type: 'anniversary', color: 'bg-orange-soft' },
            { start: '2026-11-03', end: '2026-11-03', title: '학생독립운동기념일', type: 'anniversary', color: 'bg-gray-soft' },
            { start: '2026-11-05', end: '2026-11-05', title: '🏢 소상공인의 날', type: 'anniversary', color: 'bg-gray-soft' },
            { start: '2026-11-07', end: '2026-11-07', title: '❄️ 입동', type: 'season', color: 'bg-yellow-soft' },
            { start: '2026-11-09', end: '2026-11-09', title: '🚒 소방의 날', type: 'anniversary', color: 'bg-red-soft' },
            { start: '2026-11-11', end: '2026-11-11', title: '🍫 빼빼로데이 / 🛍️ 광군제', type: 'anniversary', color: 'bg-pink-soft' },
            { start: '2026-11-14', end: '2026-11-14', title: '🎬 무비데이', type: 'anniversary', color: 'bg-gray-soft' },
            { start: '2026-11-17', end: '2026-11-17', title: '🇰🇷 순국선열의 날', type: 'holiday', color: 'bg-gray-soft' },
            { start: '2026-11-19', end: '2026-11-19', title: '📝 2027 수능 / 아동학대예방', type: 'anniversary', color: 'bg-red-soft' },
            { start: '2026-11-22', end: '2026-11-22', title: '🥬 김치의 날', type: 'anniversary', color: 'bg-red-soft' },
            { start: '2026-11-27', end: '2026-11-27', title: '🛍️ 블랙프라이데이', type: 'business', color: 'bg-gray-soft' },

            // 12월 (DEC)
            { start: '2026-12-03', end: '2026-12-03', title: '🛒 소비자의 날', type: 'anniversary', color: 'bg-gray-soft' },
            { start: '2026-12-04', end: '2026-12-04', title: '🐆 국제 치타의 날', type: 'anniversary', color: 'bg-yellow-soft' },
            { start: '2026-12-05', end: '2026-12-05', title: '🤝 자원봉사자의 날 / 무역의 날', type: 'anniversary', color: 'bg-blue-soft' },
            { start: '2026-12-06', end: '2026-12-06', title: '🏎️ F1 폐막', type: 'sport', color: 'bg-blue-soft' },
            { start: '2026-12-14', end: '2026-12-14', title: '🫂 허그데이', type: 'anniversary', color: 'bg-pink-soft' },
            { start: '2026-12-22', end: '2026-12-22', title: '🥣 동지', type: 'season', color: 'bg-yellow-soft' },
            { start: '2026-12-24', end: '2026-12-27', title: '🎨 서일페 윈터', type: 'culture', color: 'bg-purple-soft' },
            { start: '2026-12-25', end: '2026-12-25', title: '🎅 크리스마스', type: 'holiday', color: 'bg-red-soft' },
            { start: '2026-12-27', end: '2026-12-27', title: '⚛️ 원자력의 날', type: 'anniversary', color: 'bg-gray-soft' },
            { start: '2026-12-31', end: '2026-12-31', title: '🎉 연말 카운트다운', type: 'culture', color: 'bg-purple-soft' }
        ];

        let currentDate = new Date(2026, 0, 1);
        let isHyperMode = false;
        let highlightedEventId = null;

        const calendarEl = document.getElementById('calendar');
        const dateDisplayEl = document.getElementById('currentDateDisplay');
        const standardInsightEl = document.getElementById('standardInsightContainer');
        const hyperModeContentEl = document.getElementById('hyperModeContent');
        const hyperToggleBtn = document.getElementById('hyperToggleBtn');
        const searchInput = document.getElementById('eventSearch');
        const searchResultsEl = document.getElementById('searchResults');
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        
        // --- Sidebar Resize Logic ---
        const sidebar = document.getElementById('sidebar');
        const resizer = document.getElementById('resizer');
        const mobileUpBtn = document.getElementById('mobileUpBtn');
        
        // Desktop Resize
        let isResizing = false;
        resizer.addEventListener('mousedown', (e) => {
            if (window.innerWidth <= 768) return; 
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
        });

        function handleResize(e) {
            if (!isResizing) return;
            const newWidth = e.clientX;
            if (newWidth > 300 && newWidth < 600) { 
                sidebar.style.width = `${newWidth}px`;
            }
        }

        function stopResize() {
            isResizing = false;
            document.body.style.cursor = 'default';
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', stopResize);
        }

        // Mobile UP/DOWN Toggle
        let sheetOpen = false;

        function updateSheetState(open) {
            sheetOpen = open;
            if (sheetOpen) {
                sidebar.classList.add('sheet-open');
                mobileUpBtn.innerText = "DOWN ▼";
            } else {
                sidebar.classList.remove('sheet-open');
                mobileUpBtn.innerText = "UP ▲";
                
                // Sync Hyper Mode button state (Reset on close)
                if (isHyperMode) {
                    isHyperMode = false;
                    hyperModeContentEl.classList.remove('active');
                    hyperToggleBtn.classList.remove('active');
                    hyperToggleBtn.innerHTML = `<span>하이퍼 모드 🔥 OFF</span>`;
                }
            }
        }

        mobileUpBtn.addEventListener('click', () => {
            updateSheetState(!sheetOpen);
        });

        // Hyper Mode Logic
        hyperToggleBtn.addEventListener('click', () => {
            isHyperMode = !isHyperMode;
            
            if (isHyperMode) {
                hyperModeContentEl.classList.add('active');
                hyperToggleBtn.classList.add('active');
                hyperToggleBtn.innerHTML = `<span>하이퍼 모드 🔥 ON</span>`;
                
                // Mobile: Auto open sheet
                if (window.innerWidth <= 768 && !sheetOpen) {
                    updateSheetState(true);
                }
            } else {
                hyperModeContentEl.classList.remove('active');
                hyperToggleBtn.classList.remove('active');
                hyperToggleBtn.innerHTML = `<span>하이퍼 모드 🔥 OFF</span>`;
            }
        });


        // --- Clock Widget ---
        function updateClock() {
            const now = new Date();
            const dateStr = now.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
            const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
            document.getElementById('realTimeClock').innerText = `${dateStr} ${timeStr}`;
        }
        setInterval(updateClock, 1000);
        updateClock();

        // --- Keyboard Navigation State ---
        let currentSearchIndex = -1;

// --- Search Logic with Keyboard Navigation ---
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase(); // 공백 포함 검색어
            const termNoSpace = term.replace(/\s+/g, ''); // 공백 제거 검색어 (1월 1일 -> 1월1일 매칭용)
            
            searchResultsEl.innerHTML = '';
            currentSearchIndex = -1;
            
            if(term === '') {
                searchResultsEl.classList.add('hidden');
                return;
            }

            const matches = rawEvents.filter(ev => {
                // 1. 제목 검색 (기존 기능)
                if (ev.title.toLowerCase().includes(term)) return true;

                // 2. 날짜 검색 로직 추가
                // ev.start 포맷은 "2026-01-01"
                const [y, m, d] = ev.start.split('-');
                const month = parseInt(m); // 01 -> 1
                const day = parseInt(d);   // 01 -> 1

                // 검색 가능한 다양한 날짜 포맷 정의
                const dateFormats = [
                    ev.start,                       // "2026-01-01"
                    `${m}-${d}`,                    // "01-01"
                    `${month}.${day}`,              // "1.1"
                    `${month}월 ${day}일`,          // "1월 1일"
                    `${month}월${day}일`            // "1월1일"
                ];

                // 위 포맷 중 하나라도 검색어를 포함하면 통과
                return dateFormats.some(fmt => fmt.includes(term) || fmt.includes(termNoSpace));
            });
            
            if (matches.length > 0) {
                searchResultsEl.classList.remove('hidden');
                matches.forEach((ev, index) => {
                    const item = document.createElement('div');
                    item.className = 'px-4 py-2 text-sm cursor-pointer search-item border-b border-gray-100 last:border-0';
                    // 검색 결과에 날짜를 더 잘 보이게 표시
                    item.innerHTML = `<span class="font-bold search-result-title">${ev.title}</span> <span class="text-xs ml-2 font-medium search-result-date text-blue-500">${ev.start}</span>`;
                    
                    item.onclick = () => {
                        navigateToEvent(ev);
                        searchResultsEl.classList.add('hidden');
                        searchInput.value = '';
                        currentSearchIndex = -1;
                    };
                    searchResultsEl.appendChild(item);
                });
            } else {
                searchResultsEl.classList.add('hidden');
            }
        });

        searchInput.addEventListener('keydown', (e) => {
            const items = searchResultsEl.children;
            if (items.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentSearchIndex++;
                if (currentSearchIndex >= items.length) currentSearchIndex = 0;
                updateSearchSelection(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentSearchIndex--;
                if (currentSearchIndex < 0) currentSearchIndex = items.length - 1;
                updateSearchSelection(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentSearchIndex > -1) {
                    items[currentSearchIndex].click();
                }
            }
        });

        function updateSearchSelection(items) {
            Array.from(items).forEach((item, index) => {
                if (index === currentSearchIndex) {
                    item.classList.add('keyboard-selected');
                    item.scrollIntoView({ block: 'nearest' });
                } else {
                    item.classList.remove('keyboard-selected');
                }
            });
        }

        function navigateToEvent(event) {
            const targetDate = new Date(event.start);
            currentDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
            highlightedEventId = event.title + event.start; 
            renderCalendar();
            
            setTimeout(() => {
                highlightedEventId = null;
                const highlightedElements = document.querySelectorAll('.event-highlighted');
                highlightedElements.forEach(el => el.classList.remove('event-highlighted'));
            }, 2000);
        }

        // --- Diff Days ---
        function diffDays(d1, d2) {
            const t1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
            const t2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
            return Math.round((t2 - t1) / (1000 * 60 * 60 * 24)) + 1;
        }

        // --- Sidebar Logic ---
        function updateSidebar(monthIndex) {
            const data = monthlyInsights[monthIndex + 1] || { theme: "-", keywords: [], eat: "-", buy: "-", play: "-", do: "-" };
            
            standardInsightEl.innerHTML = `
                <div class="insight-box">
                    <span class="insight-tag tag-core">CORE THEME</span>
                    <p class="text-sm font-bold leading-tight mt-1.5" style="color: var(--text-primary)">${data.theme}</p>
                </div>
            `;

            const keywordsHtml = data.keywords.map(k => `<span class="keyword-chip">${k}</span>`).join('');
            
            hyperModeContentEl.innerHTML = `
                <div class="insight-box border-l-4 border-l-blue-500">
                    <span class="insight-tag bg-blue-100 text-blue-800">SEASON LABEL</span>
                    <p class="text-xs font-semibold mt-1" style="color: var(--text-primary)">${data.seasonLabel}</p>
                </div>

                <div class="insight-box">
                    <span class="insight-tag tag-hyper">MONTHLY KEYWORDS</span>
                    <div class="mt-2 leading-snug">${keywordsHtml}</div>
                </div>

                <div class="space-y-2 mt-4">
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Strategy</div>
                    <div class="bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm flex gap-2 items-start">
                        <div class="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 rounded mt-0.5">EAT</div>
                        <p class="text-xs text-gray-600 dark:text-gray-300 leading-snug">${data.eat}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm flex gap-2 items-start">
                        <div class="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 rounded mt-0.5">BUY</div>
                        <p class="text-xs text-gray-600 dark:text-gray-300 leading-snug">${data.buy}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm flex gap-2 items-start">
                        <div class="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 rounded mt-0.5">PLAY</div>
                        <p class="text-xs text-gray-600 dark:text-gray-300 leading-snug">${data.play}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm flex gap-2 items-start">
                        <div class="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 rounded mt-0.5">DO</div>
                        <p class="text-xs text-gray-600 dark:text-gray-300 leading-snug">${data.do}</p>
                    </div>
                </div>
            `;
        }

        // --- Calendar Render ---
        function renderCalendar() {
            calendarEl.innerHTML = '';
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const dateText = `${year}년 ${month + 1}월`;
            
            document.getElementById('currentDateDisplay').innerText = dateText;

            prevBtn.disabled = (year === 2026 && month === 0);
            nextBtn.disabled = (year === 2026 && month === 11);

            updateSidebar(month);

            const firstDayOfMonth = new Date(year, month, 1);
            const startDay = new Date(firstDayOfMonth);
            startDay.setDate(startDay.getDate() - startDay.getDay());
            const endDay = new Date(startDay);
            endDay.setDate(endDay.getDate() + 41);

            let currentWeekStart = new Date(startDay);
            
            while (currentWeekStart <= endDay) {
                if (diffDays(startDay, currentWeekStart) > 42) break;

                const weekRow = document.createElement('div');
                weekRow.className = 'week-row';
                
                const bgContainer = document.createDocumentFragment();
                const weekDates = [];
                for(let i=0; i<7; i++) {
                    const day = new Date(currentWeekStart);
                    day.setDate(day.getDate() + i);
                    weekDates.push(day);

                    const cell = document.createElement('div');
                    cell.className = 'day-bg';
                    if (day.getMonth() !== month) cell.classList.add('disabled-month');
                    
                    const dateNum = document.createElement('div');
                    dateNum.className = 'date-num';
                    dateNum.innerText = day.getDate();
                    const dateString = day.toDateString(); 
                    dateNum.setAttribute('data-date', dateString);

                    if (day.getDay() === 0) dateNum.classList.add('text-holiday');
                    if (day.getDay() === 6) dateNum.classList.add('text-sat');

                    cell.appendChild(dateNum);
                    bgContainer.appendChild(cell);
                }
                weekRow.appendChild(bgContainer);

                const eventsContainer = document.createElement('div');
                eventsContainer.className = 'events-layer';
                
                const weekStart = weekDates[0];
                const weekEnd = weekDates[6];
                
                let weekEvents = rawEvents.filter(e => {
                    const eStart = new Date(e.start);
                    const eEnd = new Date(e.end);
                    return eStart <= weekEnd && eEnd >= weekStart;
                }).map(e => {
                    const eStart = new Date(e.start);
                    const eEnd = new Date(e.end);
                    const actualStart = eStart < weekStart ? weekStart : eStart;
                    const actualEnd = eEnd > weekEnd ? weekEnd : eEnd;
                    const startIdx = diffDays(weekStart, actualStart) - 1;
                    const duration = diffDays(actualStart, actualEnd);
                    return { ...e, startIdx, duration, isContinuesLeft: eStart < weekStart, isContinuesRight: eEnd > weekEnd };
                });

                weekEvents.sort((a, b) => {
                    const durA = diffDays(new Date(a.start), new Date(a.end));
                    const durB = diffDays(new Date(b.start), new Date(b.end));
                    if(durA !== durB) return durB - durA;
                    return new Date(a.start) - new Date(b.start);
                });

                const slots = [];
                weekEvents.forEach(evt => {
                    let slotIdx = 0;
                    while(true) {
                        if (!slots[slotIdx]) slots[slotIdx] = Array(7).fill(false);
                        let canFit = true;
                        for(let d = evt.startIdx; d < evt.startIdx + evt.duration; d++) {
                            if (slots[slotIdx][d]) { canFit = false; break; }
                        }
                        if(canFit) {
                            for(let d = evt.startIdx; d < evt.startIdx + evt.duration; d++) slots[slotIdx][d] = true;
                            evt.slotIdx = slotIdx;
                            break;
                        }
                        slotIdx++;
                    }
                });

                weekEvents.forEach(evt => {
                    const bar = document.createElement('div');
                    bar.className = `event-bar ${evt.color}`;
                    bar.innerText = evt.title;
                    
                    if (highlightedEventId === evt.title + evt.start) {
                        bar.classList.add('event-highlighted');
                    }

                    bar.style.left = `calc(${evt.startIdx * 14.28}% + 2px)`;
                    bar.style.width = `calc(${evt.duration * 14.28}% - 4px)`;
                    bar.style.top = `${evt.slotIdx * 24}px`;
                    
                    if (evt.isContinuesLeft) {
                        bar.classList.add('rounded-l-none');
                        bar.style.left = `calc(${evt.startIdx * 14.28}%)`;
                        bar.style.width = `calc(${evt.duration * 14.28}% - 2px)`;
                    }
                    if (evt.isContinuesRight) {
                        bar.classList.add('rounded-r-none');
                    }
                    if (evt.isContinuesLeft && evt.isContinuesRight) {
                         bar.style.width = `calc(${evt.duration * 14.28}%)`;
                    }
                    
                    // Mobile Expand Click
                    bar.addEventListener('click', (e) => {
                        if (window.innerWidth <= 768) {
                            e.stopPropagation(); // Stop bubble
                            const isExpanded = bar.classList.contains('mobile-expanded');
                            document.querySelectorAll('.event-bar.mobile-expanded').forEach(el => el.classList.remove('mobile-expanded'));
                            if (!isExpanded) {
                                bar.classList.add('mobile-expanded');
                            }
                        }
                    });

                    eventsContainer.appendChild(bar);
                });
                
                const maxSlot = slots.length;
                const minHeight = 120;
                const requiredHeight = 30 + (maxSlot * 24) + 10;
                if (requiredHeight > minHeight) weekRow.style.minHeight = `${requiredHeight}px`;

                weekRow.appendChild(eventsContainer);
                calendarEl.appendChild(weekRow);

                currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            }
        }

        // Close mobile event popups on global click
        document.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                document.querySelectorAll('.event-bar.mobile-expanded').forEach(el => el.classList.remove('mobile-expanded'));
            }
        });

        // --- Navigation Logic ---
        const minDate = new Date(2026, 0, 1);
        const maxDate = new Date(2026, 11, 1);

        function goToToday() {
            const now = new Date(); 
            if (now.getFullYear() === 2026) {
                currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
            } else {
                currentDate = new Date(2026, 0, 1);
            }
            renderCalendar();

            setTimeout(() => {
                const todayString = now.toDateString();
                const targetCell = document.querySelector(`.date-num[data-date="${todayString}"]`);
                if (targetCell) {
                    targetCell.classList.add('animate-today');
                    setTimeout(() => targetCell.classList.remove('animate-today'), 1000);
                }
            }, 50);
        }

        prevBtn.addEventListener('click', () => {
            if (currentDate <= minDate) return;
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });

        nextBtn.addEventListener('click', () => {
            if (currentDate >= maxDate) return;
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });

        document.getElementById('darkModeToggle').addEventListener('change', (e) => {
            if(e.target.checked) document.body.classList.add('dark-mode');
            else document.body.classList.remove('dark-mode');
        });

        // Initialize
        renderCalendar();
    </script>
</body>
</html>
