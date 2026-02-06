import { initializeApp } from "https://www.gstatic.com/firebasejs/10.x/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, updateDoc, doc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.x/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.x/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyAvwbUdQ7TfFOsgGln4HQBdMdYo-KYHUDY",
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
        const role = document.getElementById('userRole').value;

        if(!id || !pass) return alert("ദയവായി ID-യും പാസ്‌വേഡും നൽകുക");

        // യൂസർ 1348 എന്ന് നൽകിയാൽ അത് 1348@madrasa.com എന്നായി മാറും
        const email = id.includes('@') ? id.toLowerCase() : `${id.toLowerCase()}@madrasa.com`; 

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            localStorage.setItem('uid', userCredential.user.uid);
            localStorage.setItem('role', role);
            localStorage.setItem('email', email);
            
            document.getElementById('displayUser').innerText = role.toUpperCase() + ": " + id;
            app.showPage('dash-sec');
        } catch (error) {
            console.error("Login Error:", error.code);
            alert("Login Failed: ID അല്ലെങ്കിൽ Password തെറ്റാണ്!");
        }
    },

    showPage: (id) => {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(id).classList.add('active');
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
            status: "draft"
        };
        try {
            await addDoc(collection(db, "students"), data);
            alert("Saved Successfully!");
            app.showPage('dash-sec');
        } catch (e) { alert("Error saving data!"); }
    },

    loadStudents: async () => {
        const role = localStorage.getItem('role');
        const uid = localStorage.getItem('uid');
        let q = collection(db, "students");

        // മദ്റസയാണെങ്കിൽ സ്വന്തം കുട്ടികളെ മാത്രം കാണിക്കുന്നു
        if(role === 'madrasa') q = query(q, where("madrasa_id", "==", uid));

        const querySnapshot = await getDocs(q);
        const list = document.getElementById('studentList');
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
        await updateDoc(doc(db, "students", id), {
            name: document.getElementById('editName').value,
            class: document.getElementById('editClass').value,
            div: document.getElementById('editDiv').value
        });
        document.getElementById('editModal').style.display = 'none';
        app.loadStudents();
    },

    archiveStudent: async (id) => {
        if(!confirm("ഈ കുട്ടിയുടെ വിവരം ഡിലീറ്റ് ചെയ്ത് ആർക്കൈവിലേക്ക് മാറ്റട്ടെ?")) return;
        const snap = await getDoc(doc(db, "students", id));
        try {
            await addDoc(collection(db, "archived_students"), { 
                ...snap.data(), 
                archivedAt: new Date(),
                archivedBy: localStorage.getItem('email')
            });
            await deleteDoc(doc(db, "students", id));
            alert("Archived successfully");
            app.loadStudents();
        } catch (e) { alert("Permission denied!"); }
    },

    updateStatus: async (id, status) => {
        await updateDoc(doc(db, "students", id), { status });
        app.loadStudents();
    },

    printVerified: () => {
        const rows = document.getElementById('studentList').rows;
        let printContent = "<h2>Verified Students List</h2><table border='1' style='width:100%; border-collapse:collapse; text-align:left;'><tr><th>Name</th><th>Class</th></tr>";
        let count = 0;
        for (let row of rows) {
            if(row.cells[2].innerText === "verified") {
                printContent += `<tr><td>${row.cells[0].innerText}</td><td>${row.cells[1].innerText}</td></tr>`;
                count++;
            }
        }
        printContent += "</table>";
        if(count === 0) return alert("വെരിഫൈ ചെയ്ത കുട്ടികൾ ആരുമില്ല!");
        const win = window.open('', '', 'width=800,height=600');
        win.document.write(printContent);
        win.print();
        win.close();
    },

    logout: () => { 
        signOut(auth).then(() => {
            localStorage.clear();
            location.reload(); 
        });
    }
};

window.app = app;


