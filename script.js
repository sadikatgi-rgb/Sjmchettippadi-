import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
    // ലോഗിൻ ചെയ്ത യൂസറുടെ റോൾ (range/madrasa) ശേഖരിക്കാൻ
    userRole: null,

    login: async () => {
        const id = document.getElementById('userID').value.trim();
        const pass = document.getElementById('password').value;
        const role = document.getElementById('userRole').value;
        const email = id.includes('@') ? id : `${id}@madrasa.com`;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
            
            if (userDoc.exists() && userDoc.data().role === role) {
                app.userRole = role;
                localStorage.setItem('role', role);
                document.getElementById('navbar').style.display = 'flex';
                app.setupUI(role);
                app.showPage('dash-sec');
            } else { await signOut(auth); alert("അനുമതിയില്ല!"); }
        } catch (e) { alert("Login Failed: " + e.message); }
    },

    // റോൾ അനുസരിച്ച് UI മാറ്റുന്നു
    setupUI: (role) => {
        // റൈഞ്ച് ലോഗിൻ ആണെങ്കിൽ മാത്രം ഭാരവാഹി എഡിറ്റിംഗ് ബട്ടൺ കാണിക്കുന്നു
        const commAddCard = document.querySelector('[onclick="app.showPage(\'committee-add-sec\')"]');
        if (commAddCard) commAddCard.style.display = (role === 'range') ? 'block' : 'none';
    },

    // അധ്യാപകർ - സേവ് / അപ്ഡേറ്റ്
    saveTeacher: async () => {
        const id = document.getElementById('editTeacherId').value;
        const data = {
            name: document.getElementById('tName').value,
            madrasa: document.getElementById('tMadrasa').value,
            phone: document.getElementById('tPhone').value,
            madrasa_id: auth.currentUser.uid // മദ്റസയെ തിരിച്ചറിയാൻ ഇത് സഹായിക്കുന്നു
        };

        try {
            if (id) {
                await updateDoc(doc(db, "teachers", id), data);
                alert("വിവരങ്ങൾ അപ്ഡേറ്റ് ചെയ്തു!");
            } else {
                await addDoc(collection(db, "teachers"), data);
                alert("വിവരങ്ങൾ ചേർത്തു!");
            }
            app.showPage('dash-sec');
        } catch (e) { alert("പിശക്: " + e.message); }
    },

    // ലിസ്റ്റ് കാണിക്കുമ്പോൾ ഫിൽട്ടർ ചെയ്യുന്നു
    loadTeachers: async () => {
        const role = localStorage.getItem('role');
        const container = document.getElementById('teacherTableContainer');
        let q = collection(db, "teachers");

        // ഓരോ മദ്റസയ്ക്കും അവരുടെ വിവരം മാത്രം, റൈഞ്ചിന് എല്ലാം കാണാം
        if (role === 'madrasa') {
            q = query(q, where("madrasa_id", "==", auth.currentUser.uid));
        }

        const snap = await getDocs(q);
        let html = `<table><tr><th>പേര്</th><th>മദ്റസ</th><th>ഫോൺ</th><th>Action</th></tr>`;
        
        snap.forEach(d => {
            const t = d.data();
            html += `<tr>
                <td>${t.name}</td>
                <td>${t.madrasa}</td>
                <td>${t.phone}</td>
                <td>
                    <button class="edit-btn" onclick="app.editTeacher('${d.id}')">✏️</button>
                    <button class="del-btn" onclick="app.deleteItem('teachers', '${d.id}')">🗑️</button>
                </td>
            </tr>`;
        });
        container.innerHTML = html + `</table>`;
    },

    // ഭാരവാഹികളെ ചേർക്കാൻ (റൈഞ്ചിന് മാത്രം)
    saveCommittee: async () => {
        if (localStorage.getItem('role') !== 'range') return alert("റൈഞ്ചിന് മാത്രമേ അനുമതിയുള്ളൂ!");
        
        const data = {
            role: document.getElementById('commRole').value,
            name: document.getElementById('commName').value,
            phone: document.getElementById('commPhone').value,
            order: Date.now()
        };
        await addDoc(collection(db, "committee"), data);
        alert("ഭാരവാഹിയെ ചേർത്തു!");
        app.showPage('dash-sec');
    },

    // പൊതുവായ ഡിലീറ്റ് ഫങ്ക്ഷൻ
    deleteItem: async (coll, id) => {
        if (confirm("ഇത് ഒഴിവാക്കണോ?")) {
            await deleteDoc(doc(db, coll, id));
            alert("ഒഴിവാക്കി!");
            app.loadTeachers();
            app.loadCommittee();
        }
    },

    showPage: (id) => { 
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); 
        document.getElementById(id).classList.add('active'); 
    },
    logout: () => { signOut(auth).then(() => location.reload()); }
};

window.app = app;
