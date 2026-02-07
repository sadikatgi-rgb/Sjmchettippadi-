import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, query, where, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBxN_4Nqp0D635KRwHIQXmsLk_QRit8mBM", 
    authDomain: "sjmchettippadi.firebaseapp.com",
    projectId: "sjmchettippadi",
    storageBucket: "sjmchettippadi.appspot.com",
    appId: "1:832325821137:web:415b7e26cabd77ec8d5bf0"
};

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const auth = getAuth(fbApp);
const storage = getStorage(fbApp);

const app = {
    login: async () => {
        const id = document.getElementById('userID').value;
        const pass = document.getElementById('password').value;
        const role = document.getElementById('userRole').value;
        const email = id.includes('@') ? id : `${id}@madrasa.com`;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
            if (userDoc.exists() && userDoc.data().role === role) {
                localStorage.setItem('role', role);
                app.updateProfileUI(userDoc.data());
                app.loadDashData();
            } else { await signOut(auth); alert("അനുമതിയില്ല!"); }
        } catch (e) { alert("Login Error: " + e.message); }
    },

    updateProfileUI: (data) => {
        document.getElementById('user-profile-header').style.display = 'block';
        document.getElementById('navbar').style.display = 'flex';
        document.getElementById('disp-name').innerText = data.madrasa_name || "CHETTIPPADI RANGE";
        document.getElementById('disp-place').innerText = data.place || "MALAPPURAM";
        document.getElementById('disp-role').innerText = data.role.toUpperCase();
        if(data.role === 'range') document.getElementById('range-dept-admin').style.display = 'block';
        app.showPage('dash-sec');
    },

    loadDashData: async () => {
        const role = localStorage.getItem('role');
        const uid = auth.currentUser.uid;

        // Teachers Side Scroll
        let tQ = collection(db, "teachers");
        if(role === 'madrasa') tQ = query(tQ, where("madrasa_id", "==", uid));
        const tSnap = await getDocs(tQ);
        let tHtml = "";
        tSnap.forEach(d => { tHtml += `<div class="scroll-item"><b>${d.data().name}</b><br><small>${d.data().phone}</small></div>`; });
        document.getElementById('teacher-h-scroll').innerHTML = tHtml || "No Data";

        // Students Side Scroll
        let sQ = collection(db, "students");
        if(role === 'madrasa') sQ = query(sQ, where("madrasa_id", "==", uid));
        const sSnap = await getDocs(sQ);
        let sHtml = "";
        sSnap.forEach(d => { sHtml += `<div class="scroll-item"><b>${d.data().name}</b><br><small>Class: ${d.data().class}</small></div>`; });
        document.getElementById('student-h-scroll').innerHTML = sHtml || "No Data";
    },

    saveDeptData: async () => {
        const file = document.getElementById('pdfFile').files[0];
        const msg = document.getElementById('deptMsg').value;
        const dept = document.getElementById('deptSelect').value;
        const btn = document.getElementById('saveDeptBtn');
        btn.innerText = "Uploading...";

        let url = "";
        if(file) {
            const sRef = ref(storage, `docs/${Date.now()}_${file.name}`);
            await uploadBytes(sRef, file);
            url = await getDownloadURL(sRef);
        }

        await addDoc(collection(db, "announcements"), {
            dept, msg, pdfUrl: url, timestamp: new Date(), date: new Date().toLocaleDateString('en-GB')
        });
        alert("Published!"); location.reload();
    },

    loadDept: async (name) => {
        const q = query(collection(db, "announcements"), where("dept", "==", name), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        let html = "";
        snap.forEach(d => {
            const data = d.data();
            html += `<div class="card" style="text-align:left; margin-bottom:10px;">
                <small>${data.date}</small><p>${data.msg}</p>
                ${data.pdfUrl ? `<a href="${data.pdfUrl}" target="_blank" style="color:red; font-weight:bold;">📥 Download PDF</a>` : ""}
            </div>`;
        });
        document.getElementById('dept-list-view').innerHTML = html || "No announcements.";
    },

    showPage: (id) => { 
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(id).classList.add('active'); app.closeNav(); 
    },
    openNav: () => document.getElementById("mySidebar").style.width = "250px",
    closeNav: () => document.getElementById("mySidebar").style.width = "0",
    logout: () => { signOut(auth).then(() => location.reload()); }
};
window.app = app;
