import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, updateDoc, doc, deleteDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBxN_4Nqp0D635KRwHIQXmsLk_QRit8mBM", // നിങ്ങളുടെ ശരിയായ API Key നൽകുക
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
        const selectedRole = document.getElementById('userRole').value;
        const email = id.includes('@') ? id : `${id}@madrasa.com`;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            const uid = userCredential.user.uid;
            const userDoc = await getDoc(doc(db, "users", uid));
            
            if (userDoc.exists() && userDoc.data().role === selectedRole) {
                localStorage.setItem('role', selectedRole);
                document.getElementById('navbar').style.display = 'flex';
                if(selectedRole === 'range') document.getElementById('rangeOnlyLinks').style.display = 'block';
                app.showPage('dash-sec');
                app.loadCommitteeSidebar();
            } else {
                await signOut(auth);
                alert("Role Mismatch!");
            }
        } catch (e) { alert("Error: " + e.message); }
    },

    showPage: (id) => {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        closeNav();
    },

    // ഭാരവാഹികൾ (Committee)
    addCommittee: async () => {
        const data = {
            role: document.getElementById('commRole').value,
            name: document.getElementById('commName').value,
            phone: document.getElementById('commPhone').value,
            order: Date.now()
        };
        await addDoc(collection(db, "committee"), data);
        alert("Added!");
        app.loadCommitteeManage();
    },

    loadCommitteeSidebar: async () => {
        const snap = await getDocs(query(collection(db, "committee"), orderBy("order")));
        let html = "";
        snap.forEach(d => {
            const m = d.data();
            html += `<p><b>${m.role}:</b><br>${m.name}<br>${m.phone}</p>`;
        });
        document.getElementById('sidebarCommitteeList').innerHTML = html;
    },

    loadCommitteeManage: async () => {
        const snap = await getDocs(query(collection(db, "committee"), orderBy("order")));
        let html = "<table><tr><th>Designation</th><th>Name</th><th>Action</th></tr>";
        snap.forEach(d => {
            const m = d.data();
            html += `<tr><td>${m.role}</td><td>${m.name}</td><td><button onclick="app.deleteMember('${d.id}')">❌</button></td></tr>`;
        });
        document.getElementById('committeeTable').innerHTML = html + "</table>";
    },

    deleteMember: async (id) => {
        if(confirm("Delete this member?")) {
            await deleteDoc(doc(db, "committee", id));
            app.loadCommitteeManage();
        }
    },

    // അധ്യാപകർ
    saveTeacher: async () => {
        const data = {
            name: document.getElementById('tName').value,
            place: document.getElementById('tPlace').value,
            date: document.getElementById('tDate').value,
            phone: document.getElementById('tPhone').value,
            madrasa_id: auth.currentUser.uid
        };
        await addDoc(collection(db, "teachers"), data);
        alert("Teacher Saved!");
    },

    // ... മറ്റ് ഫങ്ക്ഷനുകൾ (Student save, load etc.) ...
    
    logout: () => { signOut(auth).then(() => location.reload()); }
};

window.app = app;
