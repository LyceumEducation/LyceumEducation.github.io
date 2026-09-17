(function () {
    "use strict";

    const PROFILE_KEY = "lyceum.profile";
    const ACCOUNTS_KEY = "lyceum.accounts";
    const MEMORY_KEY = "lyceum.memory";

    const style = document.createElement("style");
    style.textContent = `
        [data-auth-nav] { display:inline-flex; align-items:center; gap:14px; }
        [data-auth-nav] a, [data-auth-nav] button { font:700 .72rem "DM Sans", sans-serif; letter-spacing:.06em; text-transform:uppercase; }
        [data-auth-nav] .auth-greeting { color:var(--muted, #635f57); font-size:.72rem; font-weight:700; }
        [data-auth-nav] .auth-link { border:0; background:transparent; color:inherit; cursor:pointer; padding:0; }
        .greeting { display:inline-block; margin:0 0 24px; border:2px solid var(--ink, #111); background:var(--acid, #d7ff3f); box-shadow:5px 5px 0 var(--ink, #111); padding:13px 17px; font-weight:700; }
        .greeting[hidden] { display:none; }
        @media (max-width:760px) { [data-auth-nav] .auth-greeting { display:none; } }
    `;
    document.head.appendChild(style);

    function read(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
        catch { return fallback; }
    }

    function localProfile() { return read(PROFILE_KEY, null); }
    function rememberProfile(profile) {
        if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        else localStorage.removeItem(PROFILE_KEY);
    }

    async function hashPassword(password) {
        const bytes = new TextEncoder().encode(password);
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    }

    async function signUp({ firstName, lastName, email, password }) {
        const normalizedEmail = email.trim().toLowerCase();
        const accounts = read(ACCOUNTS_KEY, {});
        if (accounts[normalizedEmail]) throw new Error("An account with this email already exists. Try logging in.");
        const profile = { id: `local-${Date.now()}`, email: normalizedEmail, firstName: firstName.trim(), lastName: lastName.trim() };
        accounts[normalizedEmail] = { profile, passwordHash: await hashPassword(password) };
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
        rememberProfile(profile);
    }

    async function signIn(email, password) {
        const normalizedEmail = email.trim().toLowerCase();
        const account = read(ACCOUNTS_KEY, {})[normalizedEmail];
        if (!account || account.passwordHash !== await hashPassword(password)) {
            throw new Error("The email or password is not correct.");
        }
        rememberProfile(account.profile);
    }

    function signOut() {
        rememberProfile(null);
        window.location.href = "index.html";
    }

    function showMessage(element, message, isError = true) {
        if (!element) return;
        element.textContent = message;
        element.classList.toggle("error", isError);
        element.hidden = false;
    }

    function renderAuthNav() {
        document.querySelectorAll("[data-auth-nav]").forEach(nav => {
            const profile = localProfile();
            nav.innerHTML = profile
                ? `<span class="auth-greeting">¡Hola, ${escapeHTML(profile.firstName)}!</span><button class="auth-link" type="button" data-sign-out>Sign out</button>`
                : '<a class="auth-link" href="login.html">Log in</a><a class="auth-button" href="signup.html">Sign up</a>';
            nav.querySelector("[data-sign-out]")?.addEventListener("click", signOut);
        });
    }

    function renderGreeting() {
        document.querySelectorAll("[data-greeting]").forEach(element => {
            const profile = localProfile();
            if (!profile) return;
            element.innerHTML = `¡Hola, <strong>${escapeHTML(profile.firstName)}</strong>!`;
            element.hidden = false;
        });
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
        }[character]));
    }

    window.LyceumAuth = {
        getUser: async () => localProfile(),
        signUp,
        signIn,
        signOut,
        showMessage,
        getMemory: () => read(MEMORY_KEY, {}),
        saveMemory(update) {
            const memory = { ...read(MEMORY_KEY, {}), ...update, updatedAt: new Date().toISOString() };
            localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
            return memory;
        },
    };

    document.addEventListener("DOMContentLoaded", () => {
        renderAuthNav();
        renderGreeting();
    });
})();
