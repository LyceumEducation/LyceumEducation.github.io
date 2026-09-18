(function () {
    "use strict";

    const terminalStyle = document.createElement("style");
    terminalStyle.textContent = `
        @import url("https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap");
        .terminal-backdrop { position:fixed; z-index:9999; inset:0; display:grid; place-items:center; padding:20px; background:rgba(17,17,17,.68); }
        .terminal-backdrop[hidden] { display:none; }
        .admin-terminal { width:min(820px,100%); overflow:hidden; border:2px solid #111; border-radius:8px; background:#fffdf8; box-shadow:14px 14px 0 #111; color:#111; font:400 .9rem/1.65 "Space Mono","Courier New",monospace; }
        .terminal-bar { display:flex; align-items:center; gap:15px; padding:11px 15px; border-bottom:2px solid #111; background:#eeeae1; font-size:.72rem; }
        .terminal-bar strong { flex:1; font-weight:700; text-align:center; }
        .terminal-bar button { border:0; color:#111; background:transparent; cursor:pointer; font-size:1.35rem; line-height:1; }
        .terminal-lights { display:flex; gap:5px; }
        .terminal-lights i { width:10px; height:10px; border:1px solid #111; border-radius:50%; background:#ef4d3c; }
        .terminal-lights i:nth-child(2) { background:#f4bf4f; }
        .terminal-lights i:nth-child(3) { background:#55c77d; }
        .terminal-screen { min-height:315px; max-height:70vh; overflow:auto; padding:25px; }
        .terminal-dim { color:#635f57; }
        .terminal-prompt { display:flex; flex-wrap:wrap; align-items:baseline; gap:0 8px; margin-top:14px; }
        .terminal-user { color:#168447; font-weight:700; }
        .terminal-arrow, .terminal-dollar { color:#111; font-weight:400; }
        .terminal-path { color:#3155db; font-weight:700; }
        .terminal-branch { color:#3155db; font-weight:400; }
        .terminal-main { color:#ef4d3c; font-weight:700; }
        .terminal-prompt input { flex:1 1 180px; min-width:180px; border:0; outline:0; color:#111; background:transparent; font:inherit; caret-color:#111; caret-shape:block; }
        .terminal-response { margin:11px 0; color:#3155db; }
        @media (max-width:560px) { .admin-terminal { box-shadow:7px 7px 0 #111; }.terminal-screen { padding:18px; }.terminal-prompt input { flex-basis:100%; margin-top:8px; } }
    `;
    document.head.appendChild(terminalStyle);

    const terminalMarkup = `
        <div class="terminal-backdrop" data-admin-terminal hidden>
            <section class="admin-terminal" role="dialog" aria-modal="true" aria-labelledby="terminal-title">
                <div class="terminal-bar"><span class="terminal-lights"><i></i><i></i><i></i></span><strong id="terminal-title">lyceum-admin — zsh</strong><button type="button" data-terminal-close aria-label="Close terminal">×</button></div>
                <div class="terminal-screen" data-terminal-screen>
                    <p>Lyceum Education secure console <span class="terminal-dim">v1.0.26</span></p>
                    <p class="terminal-dim">This local prototype never exposes account passwords.</p>
                    <p class="terminal-prompt"><span class="terminal-user">@LyceumAdmin</span><span class="terminal-arrow">➜</span><span class="terminal-path">/workspaces/lyceum-education</span><span class="terminal-branch">(</span><span class="terminal-main">main</span><span class="terminal-branch">)</span><span class="terminal-dollar">$</span><input data-terminal-input aria-label="Terminal input" autocomplete="off" autocapitalize="characters" spellcheck="false"></p>
                </div>
            </section>
        </div>`;

    function openTerminal() {
        if (document.querySelector("[data-admin-terminal]")) return;
        document.body.insertAdjacentHTML("beforeend", terminalMarkup);
        const backdrop = document.querySelector("[data-admin-terminal]");
        const input = backdrop.querySelector("[data-terminal-input]");
        backdrop.hidden = false;
        input.focus();

        const close = () => backdrop.remove();
        backdrop.querySelector("[data-terminal-close]").addEventListener("click", close);
        backdrop.addEventListener("click", event => { if (event.target === backdrop) close(); });
        input.addEventListener("keydown", event => {
            if (event.key === "Escape") close();
            if (event.key !== "Enter") return;
            const value = input.value.trim().toUpperCase();
            input.value = "";
            const screen = backdrop.querySelector("[data-terminal-screen]");
            const line = document.createElement("p");
            line.className = "terminal-response";
            if (/^\d{5}$/.test(value)) {
                line.textContent = value === "31013" ? "Access code accepted. Enter security clearance." : "Access denied. Enter the five-digit access code.";
            } else if (value === "GARNSEY.") {
                line.textContent = "Clearance accepted. Opening Administrator Dashboard…";
                sessionStorage.setItem("lyceum.adminClearance", "granted");
                setTimeout(() => { window.location.href = "admin.html"; }, 500);
            } else {
                line.textContent = "Unknown command. Enter the five-digit access code to continue.";
            }
            screen.insertBefore(line, screen.querySelector(".terminal-prompt"));
            screen.scrollTop = screen.scrollHeight;
        });
    }

    document.addEventListener("keydown", event => {
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "a") {
            event.preventDefault();
            openTerminal();
        }
    });
})();
