import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, updateDoc, doc, deleteDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
        const selectedRole = document.getElementById('userRole').value;
        const email = id.includes('@') ? id : `${id}@madrasa.com`;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            const uid = userCredential.user.uid;
            const userDoc = await getDoc(doc(db, "users", uid));
            
            if (userDoc.exists() && userDoc.data().role === selectedRole) {
                localStorage.setItem('role', selectedRole);
                
                // ലോഗിൻ വിജയിച്ചാൽ Navbar കാണിക്കുന്നു
                document.getElementById('navbar').style.display = 'flex';
                if(selectedRole === 'range') document.getElementById('rangeOnlyLinks').style.display = 'block';
                
                app.showPage('dash-sec');
                app.loadCommitteeSidebar();
            } else {
                await signOut(auth);
                alert("തിരഞ്ഞെടുത്ത Role തെറ്റാണ്!");
            }
        } catch (e) { alert("Login Failed: " + e.message); }
    },

    showPage: (id) => {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        app.closeNav();
    },

    openNav: () => { document.getElementById("mySidebar").style.width = "250px"; },
    closeNav: () => { document.getElementById("mySidebar").style.width = "0"; },

    // ഭാരവാഹികൾ (Committee)
    loadCommitteeSidebar: async () => {
        const snap = await getDocs(query(collection(db, "committee"), orderBy("order")));
        let html = "";
        snap.forEach(d => {
            const m = d.data();
            html += `<p><b>${m.role}:</b><br>${m.name}<br>${m.phone}</p>`;
        });
        document.getElementById('sidebarCommitteeList').innerHTML = html;
    },

    addCommittee: async () => {
        const data = {
            role: document.getElementById('commRole').value,
            name: document.getElementById('commName').value,
            phone: document.getElementById('commPhone').value,
            order: Date.now()
        };
        await addDoc(collection(db, "committee"), data);
        alert("അംഗത്തെ ചേർത്തു!");
        app.loadCommitteeManage();
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
        if(confirm("ഈ അംഗത്തെ ഒഴിവാക്കട്ടെ?")) {
            await deleteDoc(doc(db, "committee", id));
            app.loadCommitteeManage();
        }
    },

    logout: () => { signOut(auth).then(() => { localStorage.clear(); location.reload(); }); }
};

window.app = app;
