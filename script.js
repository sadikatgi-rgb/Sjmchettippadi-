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
    login: async () => {
        const id = document.getElementById('userID').value; 
        const pass = document.getElementById('password').value;
        const selectedRole = document.getElementById('userRole').value; 

        if(!id || !pass) return alert("ദയവായി ID-യും പാസ്‌വേഡും നൽകുക");

        const cleanID = id.toLowerCase().trim();
        const email = cleanID.includes('@') ? cleanID : `${cleanID}@madrasa.com`; 

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            const uid = userCredential.user.uid;

            const userDoc = await getDoc(doc(db, "users", uid));
            
            if (userDoc.exists()) {
                const actualRole = userDoc.data().role;

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
            console.error("Login Error Detailed:", error); 
            // ലോഗിൻ പരാജയപ്പെടാനുള്ള കൃത്യമായ കാരണം കാണിക്കുന്നു
            if (error.code === 'auth/invalid-credential') {
                alert("Login Failed: ഐഡിയോ പാസ്‌വേഡോ തെറ്റാണ്!");
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
        const stdClass = document.getElementById('stdClass').value;
        const stdDiv = document.getElementById('stdDiv').value;

        if(!name || !stdClass || !stdDiv) return alert("എല്ലാ വിവരങ്ങളും നൽകുക");

        const data = {
            name: name,
            gender: document.getElementById('stdGender').value,
            class: stdClass,
            div: stdDiv,
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
                        <td>Std ${student.class} - ${student.div}</td>
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

    edit: async (id) => {
        const snap = await getDoc(doc(db, "students", id));
        if (snap.exists()) {
            const data = snap.data();
            document.getElementById('editId').value = id;
            document.getElementById('editName').value = data.name;
            document.getElementById('editClass').value = data.class;
            document.getElementById('editDiv').value = data.div;
            document.getElementById('editModal').style.display = 'block';
        }
    },

    updateStudent: async () => {
        const id = document.getElementById('editId').value;
        try {
            await updateDoc(doc(db, "students", id), {
                name: document.getElementById('editName').value,
                class: document.getElementById('editClass').value,
                div: document.getElementById('editDiv').value
            });
            document.getElementById('editModal').style.display = 'none';
            alert("Updated Successfully!");
            app.loadStudents();
        } catch (e) { alert("Error updating!"); }
    },

    archiveStudent: async (id) => {
        if(!confirm("ഈ കുട്ടിയെ ആർക്കൈവിലേക്ക് മാറ്റട്ടെ?")) return;
        const snap = await getDoc(doc(db, "students", id));
        try {
            await addDoc(collection(db, "archived_students"), { 
                ...snap.data(), 
                archivedAt: new Date()
            });
            await deleteDoc(doc(db, "students", id));
            alert("Archived!");
            app.loadStudents();
        } catch (e) { alert("Error archiving!"); }
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
