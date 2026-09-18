(function () {
    "use strict";

    if (sessionStorage.getItem("lyceum.adminClearance") !== "granted") {
        window.location.replace("index.html");
        return;
    }

    function readAccounts() {
        try { return JSON.parse(localStorage.getItem("lyceum.accounts") || "{}"); }
        catch { return {}; }
    }
    function readAnalytics() {
        try { return JSON.parse(localStorage.getItem("lyceum.analytics") || '{"pageViews":{},"daily":{},"sessions":0,"events":[]}'); }
        catch { return { pageViews: {}, daily: {}, sessions: 0, events: [] }; }
    }
    function formatLastActive(value) {
        if (!value) return "Not yet active";
        const date = new Date(value);
        const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
    function updateClock() {
        const clock = document.querySelector("#live-clock");
        if (clock) clock.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium" }).format(new Date());
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
        }[character]));
    }

    const accounts = Object.values(readAccounts())
        .filter(account => account && account.profile)
        .sort((a, b) => String(b.profile.id).localeCompare(String(a.profile.id)));
    const analytics = readAnalytics();
    const page = new URLSearchParams(window.location.search).get("page") || "overview";
    document.querySelectorAll("[data-admin-page]").forEach(link => link.classList.toggle("active", link.dataset.adminPage === page));
    const pageLabel = document.querySelector("#page-label");
    if (pageLabel) pageLabel.textContent = page;
    const visibleSelectors = {
        overview: ["#overview", "#activity", "#tools"],
        accounts: ["#accounts"],
        activity: ["#activity"],
        tools: ["#tools"],
    }[page] || ["#overview", "#activity", "#tools"];
    ["#overview", "#accounts", "#activity", "#tools"].forEach(selector => {
        const element = document.querySelector(selector);
        if (element) element.classList.toggle("admin-view-hidden", !visibleSelectors.includes(selector));
    });
    const totalViews = Object.values(analytics.pageViews).reduce((sum, value) => sum + value, 0);
    const practiceSessions = analytics.events.filter(event => event.type === "conjugation_practice").length;
    const activeCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeAccounts = accounts.filter(account => new Date(account.profile.lastActive || 0).getTime() >= activeCutoff).length;
    document.querySelector("#metric-active")?.replaceChildren(String(activeAccounts));
    document.querySelector("#metric-views")?.replaceChildren(String(totalViews));
    document.querySelector("#metric-sessions")?.replaceChildren(String(analytics.sessions || 0));
    document.querySelector("#metric-practice")?.replaceChildren(String(practiceSessions));
    const toolCount = document.querySelector("#tool-conjugation-count");
    const toolBar = document.querySelector("#tool-conjugation-bar");
    if (toolCount) toolCount.textContent = `${practiceSessions} practice runs`;
    if (toolBar) toolBar.style.width = `${Math.min(100, practiceSessions ? 100 : 0)}%`;
    const chart = document.querySelector("#activity-chart");
    if (chart) {
        const days = Array.from({ length: 7 }, (_, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - index));
            const key = date.toISOString().slice(0, 10);
            return { key, label: date.toLocaleDateString(undefined, { weekday: "short" }), value: analytics.daily[key] || 0 };
        });
        const max = Math.max(1, ...days.map(day => day.value));
        chart.innerHTML = days.map(day => `<i class="bar" style="--height:${Math.max(8, day.value / max * 100)}%"><span>${day.label}</span></i>`).join("");
    }
    const rows = accounts.map(account => {
        const profile = account.profile;
        const firstName = String(profile.firstName || "");
        const lastName = String(profile.lastName || "");
        const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
        const joined = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Local account";
        return `<tr><td><span class="user-cell"><span class="user-avatar">${escapeHTML(initials)}</span> ${escapeHTML(firstName)} ${escapeHTML(lastName)}</span></td><td>${escapeHTML(profile.email || "")}</td><td>${escapeHTML(joined)}</td><td>${escapeHTML(formatLastActive(profile.lastActive))}</td><td><span class="pill">Active</span></td></tr>`;
    }).join("");
    const tableBody = document.querySelector("#accounts tbody");
    const accountTotal = document.querySelector("#account-total");
    const metricTotal = document.querySelector("#metric-total");
    if (tableBody && rows.length) tableBody.innerHTML = rows;
    if (accountTotal) accountTotal.textContent = `${accounts.length} total · metadata only`;
    if (metricTotal) metricTotal.textContent = accounts.length.toLocaleString();
    updateClock();
    window.setInterval(updateClock, 1000);
})();
