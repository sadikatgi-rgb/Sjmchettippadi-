import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, updateDoc, doc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
    // ലോഗിൻ ഫങ്ക്ഷൻ
    login: async () => {
        const id = document.getElementById('userID').value.trim();
        const pass = document.getElementById('password').value;
        const selectedRole = document.getElementById('userRole').value;

        if(!id || !pass) return alert("Please enter ID and Password");

        const email = id.includes('@') ? id : `${id}@madrasa.com`;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            const uid = userCredential.user.uid;

            // Firestore-ൽ നിന്ന് റോൾ പരിശോധിക്കുന്നു
            const userDoc = await getDoc(doc(db, "users", uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role === selectedRole) {
                    localStorage.setItem('role', userData.role);
                    app.showPage('dash-sec');
                    document.getElementById('displayUser').innerText = `Welcome: ${id}`;
                } else {
                    await signOut(auth);
                    alert("തിരഞ്ഞെടുത്ത Role തെറ്റാണ്!");
                }
            } else {
                await signOut(auth);
                alert("ഈ യൂസറെ ഡാറ്റാബേസിൽ കണ്ടെത്തിയില്ല!");
            }
        } catch (error) {
            alert("Login Failed: " + error.message);
        }
    },

    showPage: (id) => {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    },

    saveStudent: async () => {
        const name = document.getElementById('stdName').value;
        const stdClass = document.getElementById('stdClass').value;
        const uid = auth.currentUser.uid;

        try {
            await addDoc(collection(db, "students"), {
                name,
                class: stdClass,
                div: document.getElementById('stdDiv').value,
                madrasa_id: uid,
                status: "pending",
                createdAt: new Date()
            });
            alert("സേവ് ചെയ്തു!");
            app.showPage('dash-sec');
        } catch (e) { alert("Error: " + e.message); }
    },

    loadStudents: async () => {
        const list = document.getElementById('studentList');
        list.innerHTML = "Loading...";
        
        const role = localStorage.getItem('role');
        let q = collection(db, "students");
        
        if(role === 'madrasa') {
            q = query(q, where("madrasa_id", "==", auth.currentUser.uid));
        }

        const snap = await getDocs(q);
        list.innerHTML = "";
        snap.forEach(sDoc => {
            const d = sDoc.data();
            list.innerHTML += `
                <tr>
                    <td>${d.name}</td>
                    <td>${d.class}</td>
                    <td>${d.status}</td>
                    <td>
                        ${role === 'range' ? `<button onclick="app.verify('${sDoc.id}')">Verify</button>` : '---'}
                    </td>
                </tr>`;
        });
    },

    verify: async (id) => {
        await updateDoc(doc(db, "students", id), { status: 'verified' });
        app.loadStudents();
    },

    logout: () => {
        signOut(auth).then(() => {
            localStorage.clear();
            location.reload();
        });
    }
};

// ആപ്പിലെ ബട്ടണുകൾക്ക് ഫങ്ക്ഷൻ കിട്ടാൻ വേണ്ടി
window.app = app;
