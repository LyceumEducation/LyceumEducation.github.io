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

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
        }[character]));
    }

    const accounts = Object.values(readAccounts())
        .filter(account => account && account.profile)
        .sort((a, b) => String(b.profile.id).localeCompare(String(a.profile.id)));
    if (!accounts.length) return;

    const rows = accounts.map(account => {
        const profile = account.profile;
        const firstName = String(profile.firstName || "");
        const lastName = String(profile.lastName || "");
        const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
        return `<tr><td><span class="user-cell"><span class="user-avatar">${escapeHTML(initials)}</span> ${escapeHTML(firstName)} ${escapeHTML(lastName)}</span></td><td>${escapeHTML(profile.email || "")}</td><td>Local account</td><td>Not tracked</td><td><span class="pill">Active</span></td></tr>`;
    }).join("");
    const tableBody = document.querySelector("#accounts tbody");
    const accountTotal = document.querySelector("#account-total");
    const metricTotal = document.querySelector("#metric-total");
    if (tableBody) tableBody.innerHTML = rows;
    if (accountTotal) accountTotal.textContent = `${accounts.length} total · metadata only`;
    if (metricTotal) metricTotal.textContent = accounts.length.toLocaleString();
})();
