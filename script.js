import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, updateDoc, doc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyAvwbUdQ7TfFOsgGln4HQBdMdYo-KYHUDY",
    authDomain: "sjmchettippadi.firebaseapp.com",
    projectId: "sjmchettippadi",
    appId: "1:832325821137:web:415b7e26cabd77ec8d5bf0"
};

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const auth = getAuth(fbApp);

const app = {
    // പരിഷ്കരിച്ച ലോഗിൻ ഫങ്ക്ഷൻ
    login: async () => {
        const id = document.getElementById('userID').value; 
        const pass = document.getElementById('password').value;
        const selectedRole = document.getElementById('userRole').value; 

        if(!id || !pass) return alert("ദയവായി ID-യും പാസ്‌വേഡും നൽകുക");

        const cleanID = id.toLowerCase().trim();
        const email = cleanID.includes('@') ? cleanID : `${cleanID}@madrasa.com`; 

        try {
            // 1. ഫയർബേസ് ഓതന്റിക്കേഷൻ
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            const uid = userCredential.user.uid;

            // 2. 'users' കളക്ഷനിൽ നിന്ന് ഈ യൂസറുടെ യഥാർത്ഥ റോൾ പരിശോധിക്കുന്നു
            const userDoc = await getDoc(doc(db, "users", uid));
            
            if (userDoc.exists()) {
                const actualRole = userDoc.data().role;

                // 3. യൂസർ തിരഞ്ഞെടുത്ത റോളും ഡാറ്റാബേസിലെ റോളും ഒന്നാണോ എന്ന് നോക്കുന്നു
                if (actualRole === selectedRole) {
                    localStorage.setItem('uid', uid);
                    localStorage.setItem('role', actualRole);
                    localStorage.setItem('email', email);
                    
                    alert("Login Success!");
                    document.getElementById('displayUser').innerText = actualRole.toUpperCase() + ": " + cleanID;
                    app.showPage('dash-sec');
                    app.loadStudents();
                } else {
                    await signOut(auth);
                    alert("Error: നിങ്ങൾ തിരഞ്ഞെടുത്ത Role തെറ്റാണ്!");
                }
            } else {
                await signOut(auth);
                alert("യൂസർ വിവരങ്ങൾ ഡാറ്റാബേസിൽ (users collection) നൽകിയിട്ടില്ല!");
            }
        } catch (error) {
            console.error("Login Error:", error.code);
            alert("Login Failed: ഐഡിയോ പാസ്‌വേഡോ തെറ്റാണ്!");
        }
    },

    showPage: (id) => {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const targetPage = document.getElementById(id);
        if(targetPage) targetPage.classList.add('active');
    },

    saveStudent: async () => {
        const name = document.getElementById('stdName').value;
        if(!name) return alert("പേര് നൽകുക");

        const data = {
            name: name,
            gender: document.getElementById('stdGender').value,
            class: document.getElementById('stdClass').value,
            div: document.getElementById('stdDiv').value,
            madrasa_id: localStorage.getItem('uid'),
            status: "draft",
            createdAt: new Date()
        };
        try {
            await addDoc(collection(db, "students"), data);
            alert("വിവരങ്ങൾ സേവ് ചെയ്തു!");
            app.loadStudents();
            app.showPage('dash-sec');
        } catch (e) { 
            console.error(e);
            alert("സേവ് ചെയ്യാൻ കഴിഞ്ഞില്ല. Security Rules പരിശോധിക്കുക."); 
        }
    },

    loadStudents: async () => {
        const role = localStorage.getItem('role');
        const uid = localStorage.getItem('uid');
        if(!uid) return;

        let q = collection(db, "students");
        if(role === 'madrasa') {
            q = query(q, where("madrasa_id", "==", uid));
        }

        try {
            const querySnapshot = await getDocs(q);
            const list = document.getElementById('studentList');
            if(!list) return;
            list.innerHTML = "";

            querySnapshot.forEach((sDoc) => {
                const student = sDoc.data();
                const isVerified = student.status === "verified";
                
                list.innerHTML += `
                    <tr>
                        <td>${student.name}</td>
                        <td>Std ${student.class}</td>
                        <td class="status-${student.status}">${student.status}</td>
                        <td>
                            ${role === 'madrasa' && !isVerified ? `<button onclick="app.edit('${sDoc.id}')">✏️</button>` : ''}
                            ${role === 'range' ? `
                                <button onclick="app.updateStatus('${sDoc.id}', 'verified')" title="Verify">✅</button>
                                <button onclick="app.archiveStudent('${sDoc.id}')" title="Archive">🗑️</button>
                            ` : ''}
                            ${isVerified && role === 'madrasa' ? '🔒' : ''}
                        </td>
                    </tr>`;
            });
        } catch (e) {
            console.error("Load Error:", e);
        }
    },

    updateStatus: async (id, status) => { 
        try {
            await updateDoc(doc(db, "students", id), { status });
            app.loadStudents();
        } catch (e) { alert("മാറ്റം വരുത്താൻ അനുവാദമില്ല!"); }
    },

    logout: () => { 
        signOut(auth).then(() => {
            localStorage.clear();
            location.reload(); 
        });
    }
};

window.app = app;

