(function () {
    "use strict";
    const KEYS = { classes: "lyceum.classes", assignments: "lyceum.assignments", submissions: "lyceum.submissions", links: "lyceum.guardianLinks", messages: "lyceum.messages" };
    const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
    const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
    const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
    const id = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const profile = LyceumAuth.getProfile();
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
    function setTitle(title) { document.querySelector("#page-title").textContent = title; }
    function showModal(title, fields, onSubmit) {
        const backdrop = document.createElement("div");
        backdrop.className = "modal-backdrop";
        backdrop.innerHTML = `<section class="modal" role="dialog" aria-modal="true"><h2>${esc(title)}</h2><form>${fields.map(field => `<label for="modal-${field.name}">${esc(field.label)}</label>${field.type === "textarea" ? `<textarea class="form-control" id="modal-${field.name}" name="${field.name}" ${field.required === false ? "" : "required"}></textarea>` : `<input class="form-control" id="modal-${field.name}" name="${field.name}" type="${field.type || "text"}" ${field.required === false ? "" : "required"}>`}`).join("")}<div class="modal-actions"><button type="button" class="outline-button" data-cancel>Cancel</button><button class="primary-button">Save</button></div></form></section>`;
        document.body.append(backdrop);
        const form = backdrop.querySelector("form");
        backdrop.querySelector("[data-cancel]").addEventListener("click", () => backdrop.remove());
        backdrop.addEventListener("click", event => { if (event.target === backdrop) backdrop.remove(); });
        form.addEventListener("submit", event => { event.preventDefault(); onSubmit(Object.fromEntries(new FormData(form))); backdrop.remove(); });
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
        content.innerHTML = `<div class="toolbar"><select id="class-filter">${own.map(item => `<option value="${esc(item.id)}" ${item.id === room.id ? "selected" : ""}>${esc(item.name)}</option>`).join("")}</select>${profile.role === "educator" && room.settings?.allowDiscussion !== false ? '<button class="primary-button" id="post-announcement">Post announcement</button>' : ""}</div><section class="card"><div class="card-head"><div><p class="overline">${esc(room.subject)}</p><h2>${esc(room.name)}</h2></div><span class="muted">${room.code}</span></div><div class="item-list">${(room.announcements || []).length ? room.announcements.slice().reverse().map(post => `<article class="item stream-post announcement"><strong>${esc(post.authorName)}</strong><small>${new Date(post.createdAt).toLocaleString()}</small><p>${esc(post.body)}</p></article>`).join("") : '<div class="empty">No announcements yet.</div>'}</div></section>`;
        document.querySelector("#class-filter").addEventListener("change", event => { activeClassId = event.target.value; renderStream(); });
        document.querySelector("#post-announcement")?.addEventListener("click", () => showModal("Post to the stream", [{ name: "body", label: "Announcement", type: "textarea" }], data => { const rooms = classes(); const target = rooms.find(item => item.id === room.id); target.announcements = target.announcements || []; target.announcements.push({ id: id("post"), authorName: `${profile.firstName} ${profile.lastName}`, body: data.body, createdAt: new Date().toISOString() }); saveClasses(rooms); renderStream(); }));
    }
    function renderClasswork() {
        setTitle("Classwork");
        const own = ownedClasses();
        const visible = assignments().filter(item => own.some(room => room.id === item.classId));
        content.innerHTML = `<div class="toolbar">${profile.role === "educator" ? '<button class="primary-button" id="new-assignment">+ Create assignment</button>' : ""}</div><section class="card"><div class="card-head"><h2>Assignments and materials</h2><span class="muted">${visible.length} items</span></div><div class="item-list">${visible.length ? visible.map(item => { const submission = submissions().find(entry => entry.assignmentId === item.id && entry.studentId === profile.id); const room = classFor(item.classId); return `<article class="item"><span class="tag">${esc(className(item.classId))}</span><strong>${esc(item.title)}</strong><small>${esc(item.instructions)}${item.dueAt ? ` · Due ${new Date(item.dueAt).toLocaleDateString()}` : ""}</small>${profile.role === "student" && room?.settings?.allowClasswork !== false ? `<button class="outline-button assignment-action" data-assignment="${esc(item.id)}">${submission ? "Update submission" : "Turn in work"}</button>` : profile.role === "educator" ? `<button class="outline-button grade-action" data-assignment="${esc(item.id)}">Review work</button>` : ""}</article>`; }).join("") : '<div class="empty">No classwork has been assigned yet.</div>'}</div></section>`;
        document.querySelector("#new-assignment")?.addEventListener("click", () => openClassChooser(room => showModal("Create classwork", [{ name: "title", label: "Title" }, { name: "instructions", label: "Instructions", type: "textarea" }, { name: "dueAt", label: "Due date", type: "date", required: false }], data => { const list = assignments(); list.push({ id: id("assignment"), classId: room.id, title: data.title, instructions: data.instructions, dueAt: data.dueAt, createdAt: new Date().toISOString() }); write(KEYS.assignments, list); renderClasswork(); })));
        document.querySelectorAll(".assignment-action").forEach(button => button.addEventListener("click", () => { const item = assignments().find(entry => entry.id === button.dataset.assignment); showModal("Turn in assignment", [{ name: "body", label: "Your response", type: "textarea" }], data => { const list = submissions().filter(entry => !(entry.assignmentId === item.id && entry.studentId === profile.id)); list.push({ id: id("submission"), assignmentId: item.id, studentId: profile.id, studentName: `${profile.firstName} ${profile.lastName}`, body: data.body, submittedAt: new Date().toISOString() }); write(KEYS.submissions, list); renderClasswork(); }); }));
        document.querySelectorAll(".grade-action").forEach(button => button.addEventListener("click", () => { const item = assignments().find(entry => entry.id === button.dataset.assignment); const work = submissions().filter(entry => entry.assignmentId === item.id); if (!work.length) { window.alert("No student submissions yet."); return; } showModal(`Grade ${work[0].studentName}`, [{ name: "grade", label: "Grade or score" }, { name: "feedback", label: "Feedback", type: "textarea" }], data => { const list = submissions(); const target = list.find(entry => entry.id === work[0].id); target.grade = data.grade; target.feedback = data.feedback; target.gradedAt = new Date().toISOString(); write(KEYS.submissions, list); renderClasswork(); }); }));
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
        content.innerHTML = `<div class="toolbar"><select id="people-class">${own.map(item => `<option value="${esc(item.id)}" ${item.id === room.id ? "selected" : ""}>${esc(item.name)}</option>`).join("")}</select>${profile.role === "educator" ? '<button class="primary-button" id="guardian-code">Create guardian invite</button><button class="outline-button" id="student-code">Share student code</button><button class="outline-button" id="class-settings">Class settings</button>' : ""}</div><section class="card"><div class="card-head"><h2>Class roster</h2><span class="muted">${rows.length} people</span></div><div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th>${profile.role === "educator" ? "<th>Time in class</th>" : ""}</tr></thead><tbody>${rows.map(person => `<tr><td><strong>${esc(person.firstName)} ${esc(person.lastName)}</strong></td><td>${esc(person.email)}</td><td><span class="role-pill">${esc(roleName[person.role] || person.role)}</span></td>${profile.role === "educator" ? `<td>${Math.floor((timeSpent[`${person.id}:${room.id}`] || 0) / 60)} min</td>` : ""}</tr>`).join("")}</tbody></table></div><p class="empty">${profile.role === "guardian" ? "You see the learners connected to your guardian account." : "Use class codes to grow your roster. Guardian codes connect a guardian to a specific student."}</p></section>`;
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
    function renderView(view) { document.querySelectorAll(".main-nav button").forEach(button => button.classList.toggle("active", button.dataset.view === view)); ({ home: renderHome, stream: renderStream, classwork: renderClasswork, people: renderPeople, grades: renderGrades }[view] || renderHome)(); }
    function educatorAction() { if (profile.role !== "educator") return; showModal("Create a classroom", [{ name: "name", label: "Class name" }, { name: "subject", label: "Subject" }], data => { const list = classes(); const room = { id: id("class"), name: data.name, subject: data.subject, educatorId: profile.id, memberIds: [profile.id], code: Math.random().toString(36).slice(2, 8).toUpperCase(), announcements: [] }; list.push(room); saveClasses(list); activeClassId = room.id; renderHome(); }); }
    function joinClass() { showModal("Join a classroom", [{ name: "code", label: "Class code" }], data => { const list = classes(); const room = list.find(item => item.code.toUpperCase() === data.code.trim().toUpperCase()); if (!room) { window.alert("That class code was not found."); return; } if (!room.memberIds.includes(profile.id)) room.memberIds.push(profile.id); saveClasses(list); activeClassId = room.id; renderHome(); }); }
    function connectGuardian() { showModal("Connect to a learner", [{ name: "code", label: "Guardian code" }], data => { const link = read(KEYS.links, []).find(item => item.code.toUpperCase() === data.code.trim().toUpperCase()); if (!link) { window.alert("That guardian code was not found."); return; } const links = read(KEYS.links, []); links.push({ ...link, guardianId: profile.id }); write(KEYS.links, links); activeClassId = link.classId; renderHome(); }); }
    function refreshMessages() { const messages = read(KEYS.messages, []).filter(message => message.to === profile.email || message.from === profile.email || message.to === "all"); document.querySelector("#chat-list").innerHTML = messages.length ? messages.map(message => `<div class="chat-message ${message.from === "admin" ? "admin" : ""}"><strong>${message.from === "admin" ? "Lyceum Admin" : "You"}</strong><div>${esc(message.body)}</div><small>${new Date(message.at).toLocaleString()}</small></div>`).join("") : '<p class="empty">No messages yet.</p>'; const unread = messages.some(message => message.to === profile.email && !message.read); document.querySelector("#chat-count").hidden = !unread; }
    document.querySelector("#user-avatar").textContent = initials; document.querySelector("#user-name").textContent = `${profile.firstName} ${profile.lastName}`; document.querySelector("#user-role").textContent = roleName[profile.role] || profile.role;
    document.querySelectorAll(".main-nav button").forEach(button => button.addEventListener("click", () => renderView(button.dataset.view)));
    document.querySelector("#sign-out").addEventListener("click", () => LyceumAuth.signOut());
    document.querySelector("#new-action").addEventListener("click", () => profile.role === "educator" ? educatorAction() : profile.role === "student" ? joinClass() : connectGuardian());
    document.querySelector("#chat-bubble button").addEventListener("click", () => { document.querySelector("#chat-panel").hidden = false; refreshMessages(); });
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
