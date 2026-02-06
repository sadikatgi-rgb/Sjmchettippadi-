import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, query, where, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
                document.getElementById('rangeAdminCard').style.display = (role === 'range') ? 'block' : 'none';
                app.showPage('dash-sec');
            } else { await signOut(auth); alert("അനുമതിയില്ല!"); }
        } catch (e) { alert("Login Error: " + e.message); }
    },

    // അഡ്മിഷൻ (Admission)
    saveStudent: async () => {
        const data = {
            name: document.getElementById('sName').value,
            class: document.getElementById('sClass').value,
            parent: document.getElementById('sParent').value,
            madrasa_id: auth.currentUser.uid,
            timestamp: new Date()
        };
        await addDoc(collection(db, "students"), data);
        alert("അഡ്മിഷൻ വിവരങ്ങൾ ചേർത്തു!"); app.showPage('dash-sec');
    },

    // ടീച്ചേഴ്സ് ലോഡ് ചെയ്യുമ്പോൾ (Range/Madrasa Filter)
    loadTeachers: async () => {
        const role = localStorage.getItem('role');
        let q = collection(db, "teachers");
        if (role === 'madrasa') q = query(q, where("madrasa_id", "==", auth.currentUser.uid));
        
        const snap = await getDocs(q);
        let html = `<table><tr><th>പേര്</th><th>മദ്റസ</th><th>Action</th></tr>`;
        snap.forEach(d => {
            html += `<tr><td>${d.data().name}</td><td>${d.data().madrasa}</td>
            <td><button class="btn" style="padding:5px; background:red;" onclick="app.deleteItem('teachers', '${d.id}')">🗑️</button></td></tr>`;
        });
        document.getElementById('teacherTableContainer').innerHTML = html || "ഡാറ്റ ലഭ്യമല്ല.";
    },

    // ഭാരവാഹികൾ
    saveCommittee: async () => {
        if (localStorage.getItem('role') !== 'range') return alert("റൈഞ്ചിന് മാത്രമേ അനുമതിയുള്ളൂ!");
        const data = {
            role: document.getElementById('commRole').value,
            name: document.getElementById('commName').value,
            phone: document.getElementById('commPhone').value,
            order: Date.now()
        };
        await addDoc(collection(db, "committee"), data);
        alert("ഭാരവാഹി വിവരങ്ങൾ അപ്ഡേറ്റ് ചെയ്തു!"); app.showPage('dash-sec');
    },

    loadCommittee: async () => {
        const snap = await getDocs(query(collection(db, "committee"), orderBy("order")));
        let html = '<div class="grid">';
        snap.forEach(d => {
            const m = d.data();
            html += `<div class="card" style="text-align:left;"><b>${m.role}</b><br>${m.name}<br>${m.phone}</div>`;
        });
        document.getElementById('committeeFolderList').innerHTML = html + "</div>";
    },

    // Side Menu Controls
    openNav: () => { document.getElementById("mySidebar").style.width = "260px"; },
    closeNav: () => { document.getElementById("mySidebar").style.width = "0"; },
    
    showPage: (id) => {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        app.closeNav();
    },

    openFolder: (dept) => {
        document.getElementById('folderContent').style.display = 'block';
        document.getElementById('folderTitle').innerText = dept + " - അറിയിപ്പുകൾ";
        document.getElementById('announcementsList').innerText = "ഈ വകുപ്പിൽ പുതിയ അറിയിപ്പുകൾ ഒന്നുമില്ല.";
    },

    deleteItem: async (coll, id) => {
        if (confirm("ഇത് ഒഴിവാക്കണോ?")) {
            await deleteDoc(doc(db, coll, id));
            alert("ഒഴിവാക്കി!");
            app.loadTeachers();
        }
    },

    logout: () => { signOut(auth).then(() => { localStorage.clear(); location.reload(); }); }
};

window.app = app;
