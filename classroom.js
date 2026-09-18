(function () {
    "use strict";
    const KEYS = { classes: "lyceum.classes", assignments: "lyceum.assignments", submissions: "lyceum.submissions", links: "lyceum.guardianLinks", messages: "lyceum.messages", notifications: "lyceum.notifications", direct: "lyceum.directMessages" };
    const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
    const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
    const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
    const rich = value => String(value ?? "").replace(/<(?!\/?(?:b|i|u|ul|ol|li|br)>)[^>]*>/gi, "");
    const id = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const baseProfile = LyceumAuth.getProfile();
    const viewedEmail = sessionStorage.getItem("lyceum.viewAs");
    const viewedAccount = viewedEmail ? Object.values(read("lyceum.accounts", {})).find(account => account.profile.email === viewedEmail) : null;
    const profile = viewedAccount?.profile || baseProfile;
    if (!profile) { window.location.replace("login.html"); return; }
    let activeClassId = null;
    const content = document.querySelector("#content");
    const classes = () => read(KEYS.classes, []);
    const assignments = () => read(KEYS.assignments, []);
    const submissions = () => read(KEYS.submissions, []);
    const saveClasses = value => write(KEYS.classes, value);
    const roleName = { student: "Student", educator: "Educator", guardian: "Guardian" };
    const initials = `${profile.firstName[0] || ""}${profile.lastName[0] || ""}`.toUpperCase();

    function ownedClasses() {
        const all = classes();
        if (profile.role === "educator") return all.filter(item => item.educatorId === profile.id);
        if (profile.role === "student") return all.filter(item => item.memberIds.includes(profile.id));
        const linkedIds = read(KEYS.links, []).filter(link => link.guardianId === profile.id).map(link => link.studentId);
        return all.filter(item => item.memberIds.some(memberId => linkedIds.includes(memberId)));
    }
    function classFor(idValue) { return classes().find(item => item.id === idValue); }
    function className(idValue) { return classFor(idValue)?.name || "Classroom"; }
    function notify(userId, body, kind = "classroom") { const list = read(KEYS.notifications, []); list.push({ id: id("notification"), userId, body, kind, at: new Date().toISOString(), read: false }); write(KEYS.notifications, list); }
    function accountById(userId) { return Object.values(read("lyceum.accounts", {})).find(account => account.profile.id === userId)?.profile; }
    function notifyGuardians(studentId, body) { read(KEYS.links, []).filter(link => link.studentId === studentId && link.guardianId).forEach(link => notify(link.guardianId, body, "guardian")); }
    function setTitle(title) { document.querySelector("#page-title").textContent = title; }
    function showModal(title, fields, onSubmit) {
        const backdrop = document.createElement("div");
        backdrop.className = "modal-backdrop";
        backdrop.innerHTML = `<section class="modal" role="dialog" aria-modal="true"><h2>${esc(title)}</h2><form>${fields.map(field => `<label for="modal-${field.name}">${esc(field.label)}</label>${field.type === "rich" ? '<div class="editor-toolbar"><button type="button" data-cmd="bold"><b>B</b></button><button type="button" data-cmd="italic"><i>I</i></button><button type="button" data-cmd="underline"><u>U</u></button><button type="button" data-cmd="insertUnorderedList">• List</button></div><div class="rich-editor" id="modal-' + field.name + '" contenteditable="true" role="textbox"></div><input type="hidden" name="' + field.name + '">' : field.type === "select" ? '<select class="form-control" id="modal-' + field.name + '" name="' + field.name + '" required>' + (field.options || []).map(option => '<option value="' + esc(option.value) + '">' + esc(option.label) + '</option>').join("") + '</select>' : field.type === "textarea" ? `<textarea class="form-control" id="modal-${field.name}" name="${field.name}" ${field.required === false ? "" : "required"}></textarea>` : `<input class="form-control" id="modal-${field.name}" name="${field.name}" type="${field.type || "text"}" ${field.required === false ? "" : "required"}>`}`).join("")}<div class="modal-actions"><button type="button" class="outline-button" data-cancel>Cancel</button><button class="primary-button">Save</button></div></form></section>`;
        document.body.append(backdrop);
        const form = backdrop.querySelector("form");
        backdrop.querySelectorAll("[data-cmd]").forEach(button => button.addEventListener("click", () => { document.execCommand(button.dataset.cmd, false); }));
        backdrop.querySelector("[data-cancel]").addEventListener("click", () => backdrop.remove());
        backdrop.addEventListener("click", event => { if (event.target === backdrop) backdrop.remove(); });
        form.addEventListener("submit", event => { event.preventDefault(); backdrop.querySelectorAll(".rich-editor").forEach(editor => { const hidden = form.querySelector(`input[name="${editor.id.replace("modal-", "")}"]`); if (hidden) hidden.value = editor.innerHTML; }); onSubmit(Object.fromEntries(new FormData(form))); backdrop.remove(); });
    }
    function openClassChooser(action) {
        const options = ownedClasses();
        if (!options.length) { window.alert("Create or join a classroom first."); return; }
        showModal("Choose a classroom", [{ name: "classId", label: "Classroom" }], data => action(classFor(data.classId)));
        const input = document.querySelector("#modal-classId");
        input.outerHTML = `<select class="form-control" id="modal-classId" name="classId" required>${options.map(item => `<option value="${esc(item.id)}">${esc(item.name)}</option>`).join("")}</select>`;
    }
    function renderHome() {
        setTitle("Your dashboard");
        const own = ownedClasses();
        const upcoming = assignments().filter(item => own.some(room => room.id === item.classId) && item.dueAt).sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 4);
        content.innerHTML = `<section class="hero-card"><div><p class="overline">Welcome back, ${esc(profile.firstName)}</p><h2>${profile.role === "educator" ? "Build a classroom that helps learning happen." : profile.role === "guardian" ? "A clear view of your learner's progress." : "Your next good move is waiting."}</h2><p>${profile.role === "educator" ? "Bring your classes, conversations, assignments, and feedback into one calm workspace." : "Keep the stream, classwork, feedback, and people who support learning in one place."}</p></div><div class="hero-stat"><strong>${own.length}</strong><span>${profile.role === "educator" ? "classes you teach" : "classes connected"}</span></div></section><div class="section-grid"><section class="card"><div class="card-head"><h2>${profile.role === "educator" ? "Your classrooms" : "Your classes"}</h2><span class="muted">${own.length} total</span></div>${own.length ? `<div class="class-grid">${own.map(room => `<button class="class-card" data-class-open="${esc(room.id)}"><span class="class-code">${esc(room.code)}</span><h3>${esc(room.name)}</h3><p>${esc(room.subject)} · ${room.memberIds.length} learners</p></button>`).join("")}</div>` : `<div class="empty">${profile.role === "educator" ? "Create your first classroom to get started." : profile.role === "student" ? "Join a classroom with the code your educator shared." : "Ask your educator for a guardian connection code."}</div>`}</section><section class="card"><div class="card-head"><h2>${profile.role === "guardian" ? "Recent feedback" : "Coming up"}</h2></div>${upcoming.length ? `<div class="item-list">${upcoming.map(item => `<div class="item"><span class="tag">${esc(className(item.classId))}</span><strong>${esc(item.title)}</strong><small>Due ${new Date(item.dueAt).toLocaleDateString()}</small></div>`).join("")}</div>` : `<div class="empty">No upcoming work. Your latest updates will appear here.</div>`}</section></div>`;
        bindClassCards();
    }
    function bindClassCards() { document.querySelectorAll("[data-class-open]").forEach(button => button.addEventListener("click", () => { activeClassId = button.dataset.classOpen; renderView("stream"); })); }
    function renderStream() {
        setTitle("Stream");
        const own = ownedClasses();
        const room = classFor(activeClassId) || own[0];
        if (!room) { content.innerHTML = `<section class="card"><div class="empty">There is no classroom stream yet.</div></section>`; return; }
        activeClassId = room.id;
        content.innerHTML = `<div class="toolbar"><select id="class-filter">${own.map(item => `<option value="${esc(item.id)}" ${item.id === room.id ? "selected" : ""}>${esc(item.name)}</option>`).join("")}</select>${profile.role === "educator" && room.settings?.allowDiscussion !== false ? '<button class="primary-button" id="post-announcement">Post announcement</button>' : ""}</div><section class="card"><div class="card-head"><div><p class="overline">${esc(room.subject)}</p><h2>${esc(room.name)}</h2></div><span class="muted">${room.code}</span></div><div class="item-list">${(room.announcements || []).length ? room.announcements.slice().reverse().map(post => `<article class="item stream-post announcement"><strong>${esc(post.authorName)}</strong><small>${new Date(post.createdAt).toLocaleString()}</small><p>${rich(post.body)}</p></article>`).join("") : '<div class="empty">No announcements yet.</div>'}</div></section>`;
        document.querySelector("#class-filter").addEventListener("change", event => { activeClassId = event.target.value; renderStream(); });
        document.querySelector("#post-announcement")?.addEventListener("click", () => showModal("Post to the stream", [{ name: "body", label: "Announcement", type: "rich" }], data => { const rooms = classes(); const target = rooms.find(item => item.id === room.id); target.announcements = target.announcements || []; target.announcements.push({ id: id("post"), authorName: `${profile.firstName} ${profile.lastName}`, body: data.body, createdAt: new Date().toISOString() }); saveClasses(rooms); renderStream(); }));
    }
    function renderClasswork() {
        setTitle("Classwork");
        const own = ownedClasses();
        const visible = assignments().filter(item => own.some(room => room.id === item.classId));
        content.innerHTML = `<div class="toolbar">${profile.role === "educator" ? '<button class="primary-button" id="new-assignment">+ Create assignment</button>' : ""}</div><section class="card"><div class="card-head"><h2>Assignments and materials</h2><span class="muted">${visible.length} items</span></div><div class="item-list">${visible.length ? visible.map(item => { const submission = submissions().find(entry => entry.assignmentId === item.id && entry.studentId === profile.id); const room = classFor(item.classId); const closed = item.dueAt && new Date(item.dueAt) < new Date(); return `<article class="item"><span class="tag">${esc(item.type || "Assignment")} · ${esc(className(item.classId))}</span><strong>${esc(item.title)}</strong><div class="rich-copy">${rich(item.instructions || "")}</div>${item.document ? `<details><summary>Open attached document</summary><div class="rich-copy">${rich(item.document)}</div></details>` : ""}<small>${item.points ? ` · ${esc(item.points)} points` : ""}${item.dueAt ? ` · Due ${new Date(item.dueAt).toLocaleDateString()}` : ""}${closed ? " · Closed" : ""}</small>${profile.role === "student" && room?.settings?.allowClasswork !== false && !closed ? `<button class="outline-button assignment-action" data-assignment="${esc(item.id)}">${submission ? "Update submission" : "Turn in work"}</button>` : profile.role === "educator" ? `<button class="outline-button grade-action" data-assignment="${esc(item.id)}">Review work</button>` : ""}</article>`; }).join("") : '<div class="empty">No classwork has been assigned yet.</div>'}</div></section>`;
        document.querySelector("#new-assignment")?.addEventListener("click", () => openClassChooser(room => showModal("Create classwork", [{ name: "type", label: "Assignment type", type: "select", options: [{ value: "assignment", label: "Assignment" }, { value: "quiz", label: "Quiz" }, { value: "discussion", label: "Discussion" }, { value: "activity", label: "Reading activity" }, { value: "vocabulary", label: "Vocabulary set" }] }, { name: "title", label: "Title" }, { name: "instructions", label: "Description and instructions", type: "rich" }, { name: "points", label: "Points", type: "number" }, { name: "dueAt", label: "Due date", type: "date", required: false }, { name: "attempts", label: "Allowed submissions (leave blank for unlimited)", type: "number", required: false }, { name: "document", label: "Attached learning document", type: "rich", required: false }, { name: "quizQuestion", label: "Quiz question (optional)" }, { name: "quizChoices", label: "Quiz choices, separated by |", required: false }, { name: "quizAnswer", label: "Correct answer (optional)", required: false }], data => { const list = assignments(); list.push({ id: id("assignment"), classId: room.id, type: data.type, title: data.title, instructions: data.instructions, document: data.document, quizQuestion: data.quizQuestion, quizChoices: data.quizChoices, quizAnswer: data.quizAnswer, points: Number(data.points) || 0, attempts: Number(data.attempts) || 0, dueAt: data.dueAt, createdAt: new Date().toISOString() }); write(KEYS.assignments, list); renderClasswork(); })));
        document.querySelectorAll(".assignment-action").forEach(button => button.addEventListener("click", () => { const item = assignments().find(entry => entry.id === button.dataset.assignment); const previous = submissions().filter(entry => entry.assignmentId === item.id && entry.studentId === profile.id).length; if (item.attempts && previous >= item.attempts) { window.alert(`This assignment allows ${item.attempts} submission${item.attempts === 1 ? "" : "s"}.`); return; } const fields = item.type === "quiz" && item.quizQuestion ? [{ name: "body", label: item.quizQuestion, type: item.quizChoices ? "select" : "rich", options: item.quizChoices.split("|").map(choice => ({ value: choice.trim(), label: choice.trim() })) }] : [{ name: "body", label: item.type === "discussion" ? "Post your response to the class discussion" : "Your response", type: "rich" }]; showModal("Turn in assignment", fields, data => { const list = submissions(); const submission = { id: id("submission"), assignmentId: item.id, classId: item.classId, studentId: profile.id, studentName: `${profile.firstName} ${profile.lastName}`, body: data.body, submittedAt: new Date().toISOString() }; if (item.type === "quiz" && item.quizAnswer) { submission.grade = data.body.trim().toLowerCase() === item.quizAnswer.trim().toLowerCase() ? item.points : 0; submission.feedback = submission.grade ? "Auto-graded correct." : "Auto-graded: review the lesson and try again."; submission.gradedAt = new Date().toISOString(); notify(profile.id, `Your quiz “${item.title}” was auto-graded.`, "grade"); } list.push(submission); write(KEYS.submissions, list); const room = classFor(item.classId); notify(room?.educatorId, `${profile.firstName} submitted “${item.title}”.`, "submission"); notifyGuardians(profile.id, `${profile.firstName} submitted “${item.title}”.`); renderClasswork(); }); }));
        document.querySelectorAll(".grade-action").forEach(button => button.addEventListener("click", () => { const item = assignments().find(entry => entry.id === button.dataset.assignment); const work = submissions().filter(entry => entry.assignmentId === item.id); if (!work.length) { window.alert("No student submissions yet."); return; } showModal(`Grade ${work[0].studentName}`, [{ name: "grade", label: `Grade out of ${item.points || "available"} points` }, { name: "feedback", label: "Feedback", type: "rich" }], data => { const list = submissions(); const target = list.find(entry => entry.id === work[0].id); target.grade = data.grade; target.feedback = data.feedback; target.gradedAt = new Date().toISOString(); write(KEYS.submissions, list); notify(target.studentId, `Your work for “${item.title}” was graded.`, "grade"); notifyGuardians(target.studentId, `${target.studentName}'s work for “${item.title}” was graded.`); renderClasswork(); }); }));
    }
    function renderPeople() {
        setTitle("People");
        const own = ownedClasses();
        const room = classFor(activeClassId) || own[0];
        if (!room) { content.innerHTML = `<section class="card"><div class="empty">Create or join a classroom to view people.</div></section>`; return; }
        activeClassId = room.id;
        const accounts = read("lyceum.accounts", {});
        const rows = room.memberIds.map(memberId => Object.values(accounts).find(account => account.profile.id === memberId)?.profile).filter(Boolean);
        const timeSpent = read("lyceum.timeSpent", {});
        const educators = rows.filter(person => person.role === "educator");
        const students = rows.filter(person => person.role === "student");
        const roster = (label, list) => `<h3 class="roster-heading">${label}</h3>${list.length ? list.map(person => `<div class="roster-person"><span class="roster-monogram">${esc(`${person.firstName[0] || ""}${person.lastName[0] || ""}`.toUpperCase())}</span><strong>${esc(person.firstName)} ${esc(person.lastName)}</strong>${profile.role === "educator" && label === "Students" ? `<small>${Math.floor((timeSpent[`${person.id}:${room.id}`] || 0) / 60)} min in class</small>` : ""}</div>`).join("") : '<p class="empty">None yet.</p>'}`;
        content.innerHTML = `<div class="toolbar"><select id="people-class">${own.map(item => `<option value="${esc(item.id)}" ${item.id === room.id ? "selected" : ""}>${esc(item.name)}</option>`).join("")}</select>${profile.role === "educator" ? '<button class="primary-button" id="guardian-code">Create guardian invite</button><button class="outline-button" id="student-code">Share student code</button><button class="outline-button" id="class-settings">Class settings</button>' : ""}</div><section class="card"><div class="card-head"><h2>People</h2><span class="muted">${rows.length} people</span></div>${roster("Educators", educators)}${roster("Students", students)}<p class="empty">${profile.role === "guardian" ? "Guardian accounts are private connections and are not displayed in the class roster." : "Only names and initials are shown to protect student privacy."}</p></section>`;
        document.querySelector("#people-class").addEventListener("change", event => { activeClassId = event.target.value; renderPeople(); });
        document.querySelector("#student-code")?.addEventListener("click", () => window.alert(`Student class code: ${room.code}`));
        document.querySelector("#guardian-code")?.addEventListener("click", () => { const student = room.memberIds.find(memberId => memberId !== profile.id); if (!student) { window.alert("Add a student before creating a guardian invite."); return; } const links = read(KEYS.links, []); const code = `${room.code}-G${Math.random().toString(36).slice(2, 6).toUpperCase()}`; links.push({ code, classId: room.id, studentId: student, createdBy: profile.id }); write(KEYS.links, links); window.alert(`Guardian invite code: ${code}`); });
        document.querySelector("#class-settings")?.addEventListener("click", () => showModal("Class settings", [{ name: "discussion", label: "Discussion (on/off)", required: false }, { name: "classwork", label: "Classwork (on/off)", required: false }], data => { const list = classes(); const target = list.find(item => item.id === room.id); target.settings = { allowDiscussion: data.discussion.toLowerCase() !== "off", allowClasswork: data.classwork.toLowerCase() !== "off" }; saveClasses(list); window.alert("Class settings saved."); }));
    }
    function renderGrades() {
        setTitle("Grades and feedback");
        const own = ownedClasses();
        const work = submissions().filter(entry => { const assignment = assignments().find(item => item.id === entry.assignmentId); return assignment && own.some(room => room.id === assignment.classId) && (profile.role !== "student" || entry.studentId === profile.id); });
        content.innerHTML = `<section class="card"><div class="card-head"><h2>${profile.role === "educator" ? "Student work" : "Your feedback"}</h2><span class="muted">${work.length} submissions</span></div><div class="table-wrap"><table><thead><tr><th>Assignment</th><th>Student</th><th>Grade</th><th>Feedback</th></tr></thead><tbody>${work.length ? work.map(entry => { const item = assignments().find(assignment => assignment.id === entry.assignmentId); return `<tr><td>${esc(item.title)}</td><td>${esc(entry.studentName)}</td><td><strong>${esc(entry.grade || "Pending")}</strong></td><td>${esc(entry.feedback || "No feedback yet")}</td></tr>`; }).join("") : '<tr><td colspan="4">No graded work to show yet.</td></tr>'}</tbody></table></div></section>`;
    }
    function renderNotifications() {
        setTitle("Notifications");
        const list = read(KEYS.notifications, []).filter(item => item.userId === profile.id).reverse();
        const all = read(KEYS.notifications, []);
        all.forEach(item => { if (item.userId === profile.id) item.read = true; });
        write(KEYS.notifications, all);
        content.innerHTML = `<section class="card"><div class="card-head"><h2>Notifications</h2><span class="muted">${list.length} updates</span></div><div class="item-list">${list.length ? list.map(item => `<article class="item notification-card"><strong>${esc(item.body)}</strong><small>${new Date(item.at).toLocaleString()}</small></article>`).join("") : '<div class="empty">You are all caught up.</div>'}</div></section>`;
        updateNotificationDot();
    }
    function renderDirectMessages() {
        setTitle("Direct messages");
        const rooms = ownedClasses();
        const recipients = rooms.map(room => accountById(profile.role === "educator" ? room.memberIds.find(idValue => idValue !== profile.id) : room.educatorId)).filter(Boolean);
        const messages = read(KEYS.direct, []).filter(item => item.from === profile.id || item.to === profile.id);
        content.innerHTML = `<section class="card"><div class="card-head"><h2>Direct messages</h2><span class="muted">Ask a question, privately</span></div><div class="toolbar"><select id="dm-recipient">${recipients.map(person => `<option value="${esc(person.id)}">${esc(person.firstName)} ${esc(person.lastName)}</option>`).join("")}</select><button class="primary-button" id="dm-send">New message</button></div><div class="item-list">${messages.length ? messages.map(message => `<article class="item"><strong>${esc(accountById(message.from)?.firstName || "User")} → ${esc(accountById(message.to)?.firstName || "User")}</strong><div class="rich-copy">${rich(message.body)}</div><small>${new Date(message.at).toLocaleString()}</small></article>`).join("") : '<div class="empty">No direct messages yet.</div>'}</div></section>`;
        document.querySelector("#dm-send")?.addEventListener("click", () => showModal("Message your educator", [{ name: "body", label: "Message", type: "rich" }], data => { const to = document.querySelector("#dm-recipient").value; const list = read(KEYS.direct, []); list.push({ id: id("dm"), from: profile.id, to, body: data.body, at: new Date().toISOString(), read: false }); write(KEYS.direct, list); notify(to, `${profile.firstName} sent you a direct message.`, "direct"); renderDirectMessages(); }));
    }
    function updateNotificationDot() { const unread = read(KEYS.notifications, []).some(item => item.userId === profile.id && !item.read); document.querySelector("#notification-dot").hidden = !unread; }
    function renderView(view) { document.querySelectorAll(".main-nav button").forEach(button => button.classList.toggle("active", button.dataset.view === view)); ({ home: renderHome, stream: renderStream, classwork: renderClasswork, people: renderPeople, grades: renderGrades, messages: renderDirectMessages, notifications: renderNotifications }[view] || renderHome)(); updateNotificationDot(); }
    function educatorAction() { if (profile.role !== "educator") return; showModal("Create a classroom", [{ name: "name", label: "Class name" }, { name: "subject", label: "Subject" }], data => { const list = classes(); const room = { id: id("class"), name: data.name, subject: data.subject, educatorId: profile.id, memberIds: [profile.id], code: Math.random().toString(36).slice(2, 8).toUpperCase(), announcements: [] }; list.push(room); saveClasses(list); activeClassId = room.id; renderHome(); }); }
    function joinClass() { showModal("Join a classroom", [{ name: "code", label: "Class code" }], data => { const list = classes(); const room = list.find(item => item.code.toUpperCase() === data.code.trim().toUpperCase()); if (!room) { window.alert("That class code was not found."); return; } if (!room.memberIds.includes(profile.id)) room.memberIds.push(profile.id); saveClasses(list); activeClassId = room.id; renderHome(); }); }
    function connectGuardian() { showModal("Connect to a learner", [{ name: "code", label: "Guardian code" }], data => { const link = read(KEYS.links, []).find(item => item.code.toUpperCase() === data.code.trim().toUpperCase()); if (!link) { window.alert("That guardian code was not found."); return; } const links = read(KEYS.links, []); links.push({ ...link, guardianId: profile.id }); write(KEYS.links, links); activeClassId = link.classId; renderHome(); }); }
    function refreshMessages() { const messages = read(KEYS.messages, []).filter(message => message.to === profile.email || message.from === profile.email || message.to === "all"); document.querySelector("#chat-list").innerHTML = messages.length ? messages.map(message => `<div class="chat-message ${message.from === "admin" ? "admin" : ""}"><strong>${message.from === "admin" ? "Lyceum Admin" : "You"}</strong><div>${rich(message.body)}</div><small>${new Date(message.at).toLocaleString()}</small></div>`).join("") : '<p class="empty">No messages yet.</p>'; const unread = messages.some(message => message.to === profile.email && !message.read); document.querySelector("#chat-count").hidden = !unread; }
    document.querySelector("#user-avatar").textContent = initials; document.querySelector("#user-name").textContent = `${profile.firstName} ${profile.lastName}`; document.querySelector("#user-role").textContent = roleName[profile.role] || profile.role;
    if (viewedAccount) { const exit = document.querySelector("#exit-view"); exit.hidden = false; exit.addEventListener("click", () => { sessionStorage.removeItem("lyceum.viewAs"); window.location.href = "admin.html?page=accounts"; }); }
    document.querySelectorAll(".main-nav button").forEach(button => button.addEventListener("click", () => renderView(button.dataset.view)));
    document.querySelector("#sign-out").addEventListener("click", () => LyceumAuth.signOut());
    document.querySelector("#new-action").addEventListener("click", () => profile.role === "educator" ? educatorAction() : profile.role === "student" ? joinClass() : connectGuardian());
    document.querySelector("#chat-bubble button").addEventListener("click", () => { document.querySelector("#chat-panel").hidden = false; refreshMessages(); });
    document.querySelector("#chat-bubble button").addEventListener("contextmenu", event => { event.preventDefault(); localStorage.setItem("lyceum.chatHidden", "true"); document.querySelector("#chat-bubble").hidden = true; });
    if (localStorage.getItem("lyceum.chatHidden") === "true" && !read(KEYS.messages, []).some(message => message.to === profile.email && !message.read)) document.querySelector("#chat-bubble").hidden = true;
    document.querySelector("#close-chat").addEventListener("click", () => { document.querySelector("#chat-panel").hidden = true; });
    document.querySelector("#chat-form").addEventListener("submit", event => { event.preventDefault(); const input = event.target.message; const list = read(KEYS.messages, []); list.push({ id: id("message"), from: profile.email, to: "admin", body: input.value.trim(), at: new Date().toISOString(), read: false }); write(KEYS.messages, list); input.value = ""; refreshMessages(); });
    window.setInterval(() => {
        const room = classFor(activeClassId);
        if (!room) return;
        const timeSpent = read("lyceum.timeSpent", {});
        const key = `${profile.id}:${room.id}`;
        timeSpent[key] = (timeSpent[key] || 0) + 60;
        write("lyceum.timeSpent", timeSpent);
    }, 60000);
    renderView("home");
})();
