import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔴 നിങ്ങളുടെ ശരിയായ Firebase Config ഇവിടെ പേസ്റ്റ് ചെയ്യുക
const firebaseConfig = {
    apiKey: "AIzaSyBxN_4Nqp0D635KRwHIQXmsLk_QRit8mBM",
    authDomain: "sjmchettippadi.firebaseapp.com",
    projectId: "sjmchettippadi",
    storageBucket: "sjmchettippadi.firebasestorage.app",
    appId: "1:832325821137:web:415b7e26cabd77ec8d5bf0"
};

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const auth = getAuth(fbApp);

const app = {
    login: async () => {
        const id = document.getElementById('userID').value;
        const pass = document.getElementById('password').value;
        const selectedRole = document.getElementById('userRole').value;
        const email = id.includes('@') ? id : `${id}@madrasa.com`;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role !== selectedRole) {
                    await signOut(auth);
                    alert("ക്ഷമിക്കണം, ഈ പാനലിൽ പ്രവേശിക്കാൻ നിങ്ങൾക്ക് അനുമതിയില്ല!");
                    return;
                }
                localStorage.setItem('userRole', userData.role);
                app.setupUI(userData);
            }
        } catch (e) { alert("Error: " + e.message); }
    },

    setupUI: (data) => {
        document.getElementById('login-sec').classList.remove('active');
        document.getElementById('navbar').style.display = 'flex';
        document.getElementById('profile-card-sec').style.display = 'block';
        document.getElementById('disp-name').innerText = data.madrasa_name || "SJM RANGE OFFICE";
        document.getElementById('disp-place').innerText = data.place || "CHETTIPPADI";
        document.getElementById('disp-role').innerText = data.role.toUpperCase();

        if (data.role === 'range') {
            document.getElementById('range-dept-admin').style.display = 'block';
            app.showPage('range-page');
        } else {
            app.showPage('madrasa-page');
            app.loadMadrasaData();
        }
    },

    loadMadrasaData: async () => {
        const uid = auth.currentUser.uid;
        // Teachers Scroll
        const tSnap = await getDocs(query(collection(db, "teachers"), where("madrasa_id", "==", uid)));
        let tHtml = "";
        tSnap.forEach(d => { tHtml += `<div class="scroll-item"><i class="fa fa-user-tie"></i><br><b>${d.data().name}</b><br><small>${d.data().phone}</small></div>`; });
        document.getElementById('teacher-h-scroll').innerHTML = tHtml || "No Teachers";

        // Students Scroll
        const sSnap = await getDocs(query(collection(db, "students"), where("madrasa_id", "==", uid)));
        let sHtml = "";
        sSnap.forEach(d => { sHtml += `<div class="scroll-item"><i class="fa fa-user-graduate"></i><br><b>${d.data().name}</b><br><small>Class: ${d.data().class}</small></div>`; });
        document.getElementById('student-h-scroll').innerHTML = sHtml || "No Students";
    },

    saveDeptData: async () => {
        const driveUrl = document.getElementById('driveLink').value;
        const msg = document.getElementById('deptMsg').value;
        const dept = document.getElementById('deptSelect').value;
        const btn = document.getElementById('saveDeptBtn');

        btn.innerText = "Processing..."; btn.disabled = true;
        try {
            await addDoc(collection(db, "announcements"), {
                dept, msg, pdfUrl: driveUrl, timestamp: new Date(), date: new Date().toLocaleDateString('en-GB')
            });
            alert("Published!"); location.reload();
        } catch (e) { alert(e.message); btn.disabled = false; }
    },

    loadDept: async (name) => {
        const q = query(collection(db, "announcements"), where("dept", "==", name), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        let html = `<h4>${name} Notifications</h4>`;
        snap.forEach(d => {
            const data = d.data();
            html += `<div class="card" style="text-align:left; margin-bottom:10px;">
                <small>${data.date}</small><p>${data.msg}</p>
                ${data.pdfUrl ? `<a href="${data.pdfUrl}" target="_blank" style="color:red; font-weight:bold;">📥 Download / View File</a>` : ""}
            </div>`;
        });
        document.getElementById('dept-list-view').innerHTML = html || "No data.";
    },

    showPage: (id) => {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        app.closeNav();
    },
    goHome: () => {
        const role = localStorage.getItem('userRole');
        app.showPage(role === 'range' ? 'range-page' : 'madrasa-page');
    },
    openNav: () => document.getElementById("mySidebar").style.width = "250px",
    closeNav: () => document.getElementById("mySidebar").style.width = "0",
    logout: () => { signOut(auth).then(() => { localStorage.clear(); location.reload(); }); }
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) app.setupUI(userDoc.data());
    }
});

window.app = app;
