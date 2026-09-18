(function () {
    "use strict";

    const terminalMarkup = `
        <div class="terminal-backdrop" data-admin-terminal hidden>
            <section class="admin-terminal" role="dialog" aria-modal="true" aria-labelledby="terminal-title">
                <div class="terminal-bar"><span class="terminal-lights"><i></i><i></i><i></i></span><strong id="terminal-title">lyceum-admin — zsh</strong><button type="button" data-terminal-close aria-label="Close terminal">×</button></div>
                <div class="terminal-screen" data-terminal-screen>
                    <p>Lyceum Education secure console <span class="terminal-dim">v1.0.26</span></p>
                    <p class="terminal-dim">This local prototype never exposes account passwords.</p>
                    <p class="terminal-prompt"><span>LyceumAdmin ➜ /workspaces/lyceum-education (main) $</span><input data-terminal-input aria-label="Terminal input" autocomplete="off" autocapitalize="characters" spellcheck="false"></p>
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
                line.textContent = value === "31013" ? "Access code accepted. Enter command: APERTA" : "Access denied. Enter the five-digit access code.";
            } else if (value === "APERTA") {
                line.textContent = "Code acknowledged. Verification required before opening Administrator Dashboard. What is the security clearance?";
            } else if (value === "CLEARANCE: APLHA-ALPHA-ONE-ONE. GARNSEY.") {
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
