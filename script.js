import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ... Firebase Config ...

const app = {
    login: async () => {
        const id = document.getElementById('userID').value;
        const pass = document.getElementById('password').value;
        const selectedRole = document.getElementById('userRole').value;
        const email = id.includes('@') ? id : `${id}@madrasa.com`;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // റോൾ പരിശോധിക്കുന്നു - തെറ്റായ ലോഗിൻ തടയുന്നു
                if (userData.role !== selectedRole) {
                    await signOut(auth);
                    alert("ക്ഷമിക്കണം, ഈ ലോഗിൻ വഴി ഈ പേജിൽ പ്രവേശിക്കാൻ കഴിയില്ല!");
                    return;
                }

                localStorage.setItem('userRole', userData.role);
                app.setupUI(userData);
            }
        } catch (e) { alert("Error: " + e.message); }
    },

    setupUI: (data) => {
        document.getElementById('login-sec').classList.remove('active');
        document.getElementById('navbar').style.display = 'flex';
        document.getElementById('profile-card-sec').style.display = 'block';
        
        document.getElementById('disp-name').innerText = data.madrasa_name || "SJM RANGE";
        document.getElementById('disp-place').innerText = data.place || "CHETTIPPADI";

        // റോൾ അനുസരിച്ച് പേജ് ഓപ്പൺ ചെയ്യുന്നു
        if (data.role === 'range') {
            app.showPage('range-page');
        } else {
            app.showPage('madrasa-page');
            app.loadMadrasaData();
        }
    },

    showPage: (id) => {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    },

    goHome: () => {
        const role = localStorage.getItem('userRole');
        app.showPage(role === 'range' ? 'range-page' : 'madrasa-page');
    },

    logout: () => {
        signOut(auth).then(() => {
            localStorage.clear();
            location.reload();
        });
    }
};
window.app = app;
