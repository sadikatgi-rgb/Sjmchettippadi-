import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// 🔴 നിങ്ങളുടെ ഫയർബേസ് വിവരങ്ങൾ താഴെ നൽകിയിരിക്കുന്ന ബ്രാക്കറ്റിനുള്ളിൽ ( { } ) നൽകുക
const firebaseConfig = {
    apiKey: "AIzaSyBxN_4Nqp0D635KRwHIQXmsLk_QRit8mBM",
    authDomain: "sjmchettippadi.firebaseapp.com",
    projectId: "sjmchettippadi",
    storageBucket: "sjmchettippadi.firebasestorage.app",
    messagingSenderId: "832325821137",
    appId: "1:832325821137:web:415b7e26cabd77ec8d5bf0"
};

// ഫയർബേസ് ഇനിഷ്യലൈസ് ചെയ്യുന്നു
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const auth = getAuth(fbApp);
const storage = getStorage(fbApp);

const app = {
    // ലോഗിൻ ഫങ്ക്ഷൻ
    login: async () => {
        const id = document.getElementById('userID').value;
        const pass = document.getElementById('password').value;
        const selectedRole = document.getElementById('userRole').value;
        
        if (!id || !pass) { alert("Please fill all fields!"); return; }

        const email = id.includes('@') ? id : `${id}@madrasa.com`;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role !== selectedRole) {
                    await signOut(auth);
                    alert("ക്ഷമിക്കണം, നിങ്ങൾക്ക് ഈ പാനലിൽ പ്രവേശിക്കാൻ അനുമതിയില്ല!");
                    return;
                }
                localStorage.setItem('userRole', userData.role);
                app.setupUI(userData);
            }
        } catch (e) { alert("Login Error: " + e.message); }
    },

    // ലോഗിൻ കഴിഞ്ഞാൽ UI മാറ്റാൻ
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

    // മദ്റസ വിവരങ്ങൾ (Teachers & Students) ലോഡ് ചെയ്യാൻ
    loadMadrasaData: async () => {
        const uid = auth.currentUser.uid;
        
        // Teachers Horizontal Scroll
        const tSnap = await getDocs(query(collection(db, "teachers"), where("madrasa_id", "==", uid)));
        let tHtml = "";
        tSnap.forEach(d => { 
            tHtml += `<div class="scroll-item"><b>${d.data().name}</b><br><small>${d.data().phone}</small></div>`; 
        });
        document.getElementById('teacher-h-scroll').innerHTML = tHtml || "No Teachers Found";

        // Students Horizontal Scroll
        const sSnap = await getDocs(query(collection(db, "students"), where("madrasa_id", "==", uid)));
        let sHtml = "";
        sSnap.forEach(d => { 
            sHtml += `<div class="scroll-item"><b>${d.data().name}</b><br><small>Class: ${d.data().class}</small></div>`; 
        });
        document.getElementById('student-h-scroll').innerHTML = sHtml || "No Students Found";
    },

    // റൈഞ്ചിന് PDF/അറിയിപ്പ് ചേർക്കാൻ
    saveDeptData: async () => {
        const file = document.getElementById('pdfFile').files[0];
        const msg = document.getElementById('deptMsg').value;
        const dept = document.getElementById('deptSelect').value;
        const btn = document.getElementById('saveDeptBtn');

        if (!msg && !file) { alert("Please add a message or file!"); return; }

        btn.innerText = "Processing..."; btn.disabled = true;

        let url = "";
        try {
            if (file) {
                const sRef = ref(storage, `docs/${Date.now()}_${file.name}`);
                await uploadBytes(sRef, file);
                url = await getDownloadURL(sRef);
            }

            await addDoc(collection(db, "announcements"), {
                dept, msg, pdfUrl: url, timestamp: new Date(), date: new Date().toLocaleDateString('en-GB')
            });
            alert("Published Successfully!"); location.reload();
        } catch (e) { alert("Error: " + e.message); btn.innerText = "Publish"; btn.disabled = false; }
    },

    // ഓരോ ഡിപ്പാർട്ട്മെന്റിലെയും വിവരങ്ങൾ കാണാൻ
    loadDept: async (name) => {
        const q = query(collection(db, "announcements"), where("dept", "==", name), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        let html = `<h4>${name} Announcements</h4>`;
        snap.forEach(d => {
            const data = d.data();
            html += `
            <div class="card" style="text-align:left; margin-bottom:10px; cursor:default; border-left: 5px solid #0056b3;">
                <small style="color:gray;">${data.date}</small>
                <p style="margin: 5px 0;">${data.msg}</p>
                ${data.pdfUrl ? `<a href="${data.pdfUrl}" target="_blank" style="color:red; font-weight:bold; text-decoration:none;"><i class="fa fa-file-pdf"></i> Download PDF</a>` : ""}
            </div>`;
        });
        document.getElementById('dept-list-view').innerHTML = html || "No announcements yet.";
    },

    // പേജ് മാറ്റാൻ
    showPage: (id) => {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        app.closeNav();
    },

    // ഹോം പേജിലേക്ക് തിരികെ പോകാൻ
    goHome: () => {
        const role = localStorage.getItem('userRole');
        app.showPage(role === 'range' ? 'range-page' : 'madrasa-page');
    },

    openNav: () => document.getElementById("mySidebar").style.width = "250px",
    closeNav: () => document.getElementById("mySidebar").style.width = "0",

    logout: () => { 
        signOut(auth).then(() => { 
            localStorage.clear(); 
            location.reload(); 
        }); 
    }
};

// പേജ് റീഫ്രഷ് ചെയ്താലും ലോഗിൻ നിലനിർത്താൻ
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) app.setupUI(userDoc.data());
    }
});

window.app = app;
