(function () {
    "use strict";

    /*
     * Create a Supabase project, enable Email and Google providers, then replace
     * these public values. The anon key is designed for browser use; never put a
     * service-role key in this file.
     */
    const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
    const SUPABASE_ANON_KEY = "YOUR-PUBLIC-ANON-KEY";
    const PROFILE_KEY = "lyceum.profile";
    const MEMORY_KEY = "lyceum.memory";
    const configured = !SUPABASE_URL.includes("YOUR-PROJECT") && !SUPABASE_ANON_KEY.includes("YOUR-PUBLIC");
    const client = configured && window.supabase
        ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        : null;

    const style = document.createElement("style");
    style.textContent = `
        [data-auth-nav] { display:inline-flex; align-items:center; gap:14px; }
        [data-auth-nav] a, [data-auth-nav] button { font:700 .72rem "DM Sans", sans-serif; letter-spacing:.06em; text-transform:uppercase; }
        [data-auth-nav] .auth-greeting { color:var(--muted, #635f57); font-size:.72rem; font-weight:700; }
        [data-auth-nav] .auth-link { border:0; background:transparent; color:inherit; cursor:pointer; padding:0; }
        .greeting { display:inline-block; margin:0 0 24px; border:2px solid var(--ink, #111); background:var(--acid, #d7ff3f); box-shadow:5px 5px 0 var(--ink, #111); padding:13px 17px; font-weight:700; }
        @media (max-width:760px) { [data-auth-nav] .auth-greeting { display:none; } }
    `;
    document.head.appendChild(style);

    function localProfile() {
        try {
            return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
        } catch {
            return null;
        }
    }

    function rememberProfile(profile) {
        if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        else localStorage.removeItem(PROFILE_KEY);
    }

    function profileFromUser(user) {
        if (!user) return null;
        const metadata = user.user_metadata || {};
        return {
            id: user.id,
            email: user.email || "",
            firstName: metadata.first_name || metadata.full_name?.split(" ")[0] || "amigo",
            lastName: metadata.last_name || "",
        };
    }

    async function getUser() {
        if (!client) return localProfile();
        const { data, error } = await client.auth.getUser();
        if (error && error.message !== "Auth session missing!") throw error;
        const profile = profileFromUser(data.user);
        rememberProfile(profile);
        return profile;
    }

    async function signUp({ firstName, lastName, email, password }) {
        if (!client) throw new Error("Authentication is not configured yet. Add the Supabase URL and public anon key in auth.js.");
        const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
                data: { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}`.trim() },
            },
        });
        if (error) throw error;
        rememberProfile(profileFromUser(data.user));
        return data;
    }

    async function signIn(email, password) {
        if (!client) throw new Error("Authentication is not configured yet. Add the Supabase URL and public anon key in auth.js.");
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        rememberProfile(profileFromUser(data.user));
        return data;
    }

    async function signInWithGoogle() {
        if (!client) throw new Error("Authentication is not configured yet. Add the Supabase URL and public anon key in auth.js.");
        const { error } = await client.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
        });
        if (error) throw error;
    }

    async function signOut() {
        if (client) {
            const { error } = await client.auth.signOut();
            if (error) throw error;
        }
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
        document.querySelectorAll("[data-auth-nav]").forEach(async nav => {
            const profile = await getUser().catch(() => null);
            nav.innerHTML = profile
                ? `<span class="auth-greeting">¡Hola, ${escapeHTML(profile.firstName)}!</span><button class="auth-link" type="button" data-sign-out>Sign out</button>`
                : '<a class="auth-link" href="login.html">Log in</a><a class="auth-button" href="signup.html">Sign up</a>';
            nav.querySelector("[data-sign-out]")?.addEventListener("click", signOut);
        });
    }

    function renderGreeting() {
        document.querySelectorAll("[data-greeting]").forEach(async element => {
            const profile = await getUser().catch(() => null);
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
        configured,
        getUser,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        showMessage,
        renderAuthNav,
        renderGreeting,
        rememberProfile,
        getMemory() {
            try { return JSON.parse(localStorage.getItem(MEMORY_KEY) || "{}"); } catch { return {}; }
        },
        saveMemory(update) {
            const memory = { ...this.getMemory(), ...update, updatedAt: new Date().toISOString() };
            localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
            return memory;
        },
    };

    document.addEventListener("DOMContentLoaded", () => {
        renderAuthNav();
        renderGreeting();
    });
})();
