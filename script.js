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
            } else { await signOut(auth); alert("Role Error!"); }
        } catch (e) { alert("Login Error: " + e.message); }
    },

    // അഡ്മിഷൻ (Admission)
    saveStudent: async () => {
        const data = {
            name: document.getElementById('sName').value,
            class: document.getElementById('sClass').value,
            parent: document.getElementById('sParent').value,
            madrasa_id: auth.currentUser.uid
        };
        await addDoc(collection(db, "students"), data);
        alert("Admission Saved!"); app.showPage('dash-sec');
    },

    // ടീച്ചേഴ്സ് ലോഡ് ചെയ്യുമ്പോൾ എഡിറ്റ്/ഡിലീറ്റ്
    loadTeachers: async () => {
        const role = localStorage.getItem('role');
        let q = collection(db, "teachers");
        if (role === 'madrasa') q = query(q, where("madrasa_id", "==", auth.currentUser.uid));
        
        const snap = await getDocs(q);
        let html = `<table><tr><th>പേര്</th><th>മദ്റസ</th><th>Action</th></tr>`;
        snap.forEach(d => {
            html += `<tr><td>${d.data().name}</td><td>${d.data().madrasa}</td>
            <td><button onclick="app.deleteItem('teachers', '${d.id}')">🗑️</button></td></tr>`;
        });
        document.getElementById('teacherTableContainer').innerHTML = html + "</table>";
    },

    // സൈഡ് മെനു ഫങ്ക്ഷനുകൾ (ഇത് വളരെ പ്രധാനം)
    openNav: () => {
        document.getElementById("mySidebar").style.width = "250px";
    },

    closeNav: () => {
        document.getElementById("mySidebar").style.width = "0";
    },

    showPage: (id) => {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        app.closeNav(); // പേജ് മാറുമ്പോൾ മെനു ക്ലോസ് ചെയ്യും
    },

    openFolder: async (dept) => {
        document.getElementById('folderContent').style.display = 'block';
        document.getElementById('folderTitle').innerText = dept;
        document.getElementById('announcementsList').innerText = "Loading updates...";
    },

    logout: () => { signOut(auth).then(() => location.reload()); }
};

window.app = app;
