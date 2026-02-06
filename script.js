import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, updateDoc, doc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyAvwbUdQ7TfFOsgGln4HQBdMdYo-KYHUDY",
    authDomain: "sjmchettippadi.firebaseapp.com", // ഇത് ലോഗിൻ ചെയ്യാൻ അത്യാവശ്യമാണ്
    projectId: "sjmchettippadi",
    appId: "1:832325821137:web:415b7e26cabd77ec8d5bf0"
};

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const auth = getAuth(fbApp);

const app = {
    login: async () => {
        const id = document.getElementById('userID').value; 
        const pass = document.getElementById('password').value;
        const role = document.getElementById('userRole').value;

        if(!id || !pass) return alert("ദയവായി ID-യും പാസ്‌വേഡും നൽകുക");

        // യൂസർ ഐഡി ട്രിം ചെയ്യുന്നു (സ്പേസ് ഒഴിവാക്കാൻ)
        const cleanID = id.toLowerCase().trim();
        const email = cleanID.includes('@') ? cleanID : `${cleanID}@madrasa.com`; 

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            localStorage.setItem('uid', userCredential.user.uid);
            localStorage.setItem('role', role);
            localStorage.setItem('email', email);
            
            alert("Login Success!");
            document.getElementById('displayUser').innerText = role.toUpperCase() + ": " + cleanID;
            app.showPage('dash-sec');
            app.loadStudents(); // ലോഗിൻ ആകുമ്പോൾ ലിസ്റ്റ് ലോഡ് ചെയ്യാൻ
        } catch (error) {
            console.error("Login Error:", error.code);
            if(error.code === 'auth/invalid-credential') {
                alert("ഐഡിയോ പാസ്‌വേഡോ തെറ്റാണ്!");
            } else {
                alert("Login Failed: " + error.message);
            }
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
            alert("സേവ് ചെയ്യാൻ കഴിഞ്ഞില്ല. റൂൾസ് പരിശോധിക്കുക."); 
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

    // മറ്റുള്ള ഫങ്ക്ഷനുകൾ (edit, update, archive) നിങ്ങളുടെ കോഡിലുള്ളത് പോലെ തന്നെ തുടരാം...
    // ലളിതമാക്കാൻ ബാക്കി ഭാഗം മാറ്റുന്നില്ല.
};

// ആപ്പിലെ മറ്റ് ഫങ്ക്ഷനുകൾ കൂടി ഇവിടെ ചേർക്കുക (edit, updateStatus, etc.)
app.edit = async (id) => { /* നിങ്ങളുടെ പഴയ കോഡ് */ };
app.updateStudent = async () => { /* നിങ്ങളുടെ പഴയ കോഡ് */ };
app.archiveStudent = async (id) => { /* നിങ്ങളുടെ പഴയ കോഡ് */ };
app.updateStatus = async (id, status) => { 
    await updateDoc(doc(db, "students", id), { status });
    app.loadStudents();
};
app.logout = () => { 
    signOut(auth).then(() => {
        localStorage.clear();
        location.reload(); 
    });
};

window.app = app;
