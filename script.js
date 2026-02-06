import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBxN_4Nqp0D635KRwHIQXmsLk_QRit8mBM", 
    authDomain: "sjmchettippadi.firebaseapp.com",
    projectId: "sjmchettippadi",
    appId: "1:832325821137:web:415b7e26cabd77ec8d5bf0"
};

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const auth = getAuth(fbApp);

const app = {
    login: async () => {
        const id = document.getElementById('userID').value.trim();
        const pass = document.getElementById('password').value;
        const role = document.getElementById('userRole').value;
        const email = id.includes('@') ? id : `${id}@madrasa.com`;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
            
            if (userDoc.exists() && userDoc.data().role === role) {
                localStorage.setItem('role', role);
                document.getElementById('navbar').style.display = 'flex';
                document.getElementById('madrasaOnlyCards').style.display = (role === 'madrasa') ? 'contents' : 'none';
                document.getElementById('madrasaStatEntry').style.display = (role === 'madrasa') ? 'block' : 'none';
                app.showPage('dash-sec');
            } else { await signOut(auth); alert("Role Error!"); }
        } catch (e) { alert("Login Failed: " + e.message); }
    },

    saveTeacher: async () => {
        const data = {
            name: document.getElementById('tName').value,
            place: document.getElementById('tPlace').value,
            madrasa: document.getElementById('tMadrasa').value,
            joinDate: document.getElementById('tJoinDate').value,
            phone: document.getElementById('tPhone').value,
            madrasa_id: auth.currentUser.uid
        };
        await addDoc(collection(db, "teachers"), data);
        alert("Saved!"); app.showPage('dash-sec');
    },

    loadTeachers: async () => {
        const role = localStorage.getItem('role');
        let q = collection(db, "teachers");
        if (role === 'madrasa') q = query(q, where("madrasa_id", "==", auth.currentUser.uid));
        const snap = await getDocs(q);
        let html = `<table><tr><th>പേര്</th><th>മദ്റസ</th><th>ഫോൺ</th></tr>`;
        snap.forEach(d => { const t = d.data(); html += `<tr><td>${t.name}</td><td>${t.madrasa}</td><td>${t.phone}</td></tr>`; });
        document.getElementById('teacherTableContainer').innerHTML = html + `</table>`;
    },

    loadCommittee: async () => {
        const snap = await getDocs(query(collection(db, "committee"), orderBy("order")));
        let html = '<div class="grid">';
        snap.forEach(d => { const m = d.data(); html += `<div class="card"><b>${m.role}</b><br>${m.name}<br>${m.phone}</div>`; });
        document.getElementById('committeeFolderList').innerHTML = html + '</div>';
    },

    openFolder: async (dept) => {
        document.getElementById('folderContent').style.display = 'block';
        document.getElementById('folderTitle').innerText = dept + " Announcements";
        const snap = await getDocs(query(collection(db, "announcements"), where("dept", "==", dept)));
        let html = "";
        snap.forEach(d => { html += `<div class="admin-box" style="margin-bottom:5px;">${d.data().msg}</div>`; });
        document.getElementById('announcementsList').innerHTML = html || "No updates.";
    },

    saveExamStat: async () => {
        const data = {
            class: document.getElementById('examClass').value,
            passed: parseInt(document.getElementById('bPassed').value) + parseInt(document.getElementById('gPassed').value),
            madrasa_id: auth.currentUser.uid
        };
        await addDoc(collection(db, "exam_stats"), data);
        alert("Updated!"); app.loadExamReport();
    },

    loadExamReport: async () => {
        const snap = await getDocs(collection(db, "exam_stats"));
        let html = "<table><tr><th>Madrasa ID</th><th>Class</th><th>Passed</th></tr>";
        snap.forEach(d => { const e = d.data(); html += `<tr><td>${e.madrasa_id}</td><td>${e.class}</td><td>${e.passed}</td></tr>`; });
        document.getElementById('examReportDisplay').innerHTML = html + "</table>";
    },

    showPage: (id) => { document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); document.getElementById(id).classList.add('active'); app.closeNav(); },
    openNav: () => { document.getElementById("mySidebar").style.width = "250px"; },
    closeNav: () => { document.getElementById("mySidebar").style.width = "0"; },
    logout: () => { signOut(auth).then(() => location.reload()); }
};
window.app = app;
