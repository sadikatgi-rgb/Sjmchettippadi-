import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
    // ലോഗിൻ
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
                app.showPage('dash-sec');
            } else { await signOut(auth); alert("Role Error!"); }
        } catch (e) { alert("Login Error: " + e.message); }
    },

    // അധ്യാപകർ - സേവ് / അപ്ഡേറ്റ്
    saveTeacher: async () => {
        const id = document.getElementById('editTeacherId').value;
        const data = {
            name: document.getElementById('tName').value,
            madrasa: document.getElementById('tMadrasa').value,
            phone: document.getElementById('tPhone').value,
            madrasa_id: auth.currentUser.uid
        };

        if (id) {
            await updateDoc(doc(db, "teachers", id), data);
            alert("Updated!");
        } else {
            await addDoc(collection(db, "teachers"), data);
            alert("Saved!");
        }
        app.showPage('dash-sec');
    },

    // അധ്യാപക പട്ടിക ലോഡ് ചെയ്യുമ്പോൾ എഡിറ്റ് ബട്ടൺ നൽകുന്നു
    loadTeachers: async () => {
        const snap = await getDocs(collection(db, "teachers"));
        let html = `<table><tr><th>പേര്</th><th>മൊബൈൽ</th><th>Action</th></tr>`;
        snap.forEach(d => {
            const t = d.data();
            html += `<tr>
                <td>${t.name}</td>
                <td>${t.phone}</td>
                <td>
                    <button onclick="app.editTeacher('${d.id}')">✏️</button>
                    <button onclick="app.deleteItem('teachers', '${d.id}')">🗑️</button>
                </td>
            </tr>`;
        });
        document.getElementById('teacherTableContainer').innerHTML = html + `</table>`;
    },

    editTeacher: async (id) => {
        const d = await getDoc(doc(db, "teachers", id));
        const t = d.data();
        document.getElementById('editTeacherId').value = id;
        document.getElementById('tName').value = t.name;
        document.getElementById('tMadrasa').value = t.madrasa;
        document.getElementById('tPhone').value = t.phone;
        app.showPage('teacher-add-sec');
    },

    // ഭാരവാഹികൾ - സേവ് / അപ്ഡേറ്റ്
    saveCommittee: async () => {
        const data = {
            role: document.getElementById('commRole').value,
            name: document.getElementById('commName').value,
            phone: document.getElementById('commPhone').value,
            order: Date.now()
        };
        await addDoc(collection(db, "committee"), data);
        alert("Committee Updated!");
        app.showPage('dash-sec');
    },

    loadCommittee: async () => {
        const snap = await getDocs(query(collection(db, "committee"), orderBy("order")));
        let html = '<div class="grid">';
        snap.forEach(d => {
            const m = d.data();
            html += `<div class="card">
                <b>${m.role}</b><br>${m.name}<br>${m.phone}<br>
                <button onclick="app.deleteItem('committee', '${d.id}')" style="margin-top:5px; border:none; background:none;">🗑️ Delete</button>
            </div>`;
        });
        document.getElementById('committeeFolderList').innerHTML = html + '</div>';
    },

    // പൊതുവായ ഡിലീറ്റ് ഫങ്ക്ഷൻ
    deleteItem: async (coll, id) => {
        if (confirm("ഉറപ്പാണോ? ഇത് എന്നെന്നേക്കുമായി ഒഴിവാക്കപ്പെടും.")) {
            await deleteDoc(doc(db, coll, id));
            alert("ഒഴിവാക്കി!");
            location.reload();
        }
    },

    showPage: (id) => { document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); document.getElementById(id).classList.add('active'); app.closeNav(); },
    openNav: () => { document.getElementById("mySidebar").style.width = "250px"; },
    closeNav: () => { document.getElementById("mySidebar").style.width = "0"; },
    logout: () => { signOut(auth).then(() => location.reload()); }
};

window.app = app;
