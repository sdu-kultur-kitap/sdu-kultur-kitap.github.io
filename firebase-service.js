import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where, arrayUnion, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// SHA-256 Password Hashing
export async function hashPassword(password) {
    if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
        // Fallback for local file:/// protocol testing
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16) + "fallback";
    }
}

export async function getPublicData() {
    const docRef = doc(db, "settings", "publicData");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
}

export async function setPublicData(data) {
    await setDoc(doc(db, "settings", "publicData"), data);
}

// ========================
// MEMBER (FRONTEND) LOGIC
// ========================

export async function registerMember(memberData) {
    // memberData = { name, identifier, department, password }
    const hashedPassword = await hashPassword(memberData.password);
    
    // Check if member already exists
    const q = query(collection(db, "members"), where("identifier", "==", memberData.identifier));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        throw new Error("Bu numara veya e-posta ile zaten kayÄ±tlÄ± bir Ã¼ye var.");
    }

    const docRef = await addDoc(collection(db, "members"), {
        name: memberData.name,
        identifier: memberData.identifier,
        department: memberData.department,
        grade: memberData.grade || '',
        phone: memberData.phone || '',
        passwordHash: hashedPassword,
        role: 'member',
        registeredAt: new Date().toISOString()
    });
    
    return { id: docRef.id, name: memberData.name, role: 'member', identifier: memberData.identifier };
}

export async function loginMember(identifier, password) {
    const hashedPassword = await hashPassword(password);
    const q = query(collection(db, "members"), 
                    where("identifier", "==", identifier),
                    where("passwordHash", "==", hashedPassword));
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        throw new Error("GiriÅŸ bilgileri hatalÄ± veya kayÄ±t bulunamadÄ±.");
    }
    
    const docData = querySnapshot.docs[0];
    const data = docData.data();
    return { id: docData.id, name: data.name, role: data.role, identifier: data.identifier };
}

// ========================
// EVENTS LOGIC
// ========================

export async function getMembers() {
    const membersSnapshot = await getDocs(collection(db, "members"));
    const members = [];
    membersSnapshot.forEach((doc) => {
        members.push({ id: doc.id, ...doc.data() });
    });
    return members;
}

export async function verifyMember(memberId) {
    if (!memberId) return false;
    const docRef = doc(db, "members", memberId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
}

export async function deleteMember(memberId) {
    const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    await deleteDoc(doc(db, "members", memberId));
}

export async function getEvents() {
    const eventsSnapshot = await getDocs(collection(db, "events"));
    const events = [];
    eventsSnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() });
    });
    return events;
}

export async function joinEvent(eventId, memberId) {
    const eventRef = doc(db, "events", eventId.toString());
    await updateDoc(eventRef, {
        participants: arrayUnion(memberId)
    });
}

// ========================
// APPLICATIONS & SUGGESTIONS
// ========================

export async function submitApplication(appData) {
    const timestamp = new Date().toISOString();
    
    // Anında aktif üye kaydı oluştur (Auto-approval)
    let memberRef = null;
    try {
        memberRef = await addDoc(collection(db, "members"), {
            name: appData.fullName || appData.name || '',
            fullName: appData.fullName || appData.name || '',
            identifier: appData.phone || appData.identifier || ((appData.fullName || 'uye').replace(/\s+/g, '').toLowerCase() + '@sdu.local'),
            department: appData.department || '',
            grade: appData.grade || '',
            phone: appData.phone || '',
            interests: appData.interests || (appData.interest ? [appData.interest] : []),
            interest: appData.interest || (Array.isArray(appData.interests) ? appData.interests.join(', ') : ''),
            role: "member",
            status: "active",
            autoApproved: true,
            registeredAt: timestamp
        });
    } catch (memErr) {
        console.warn("Direct member document creation warning:", memErr);
    }

    // Başvuru kaydını 'Onaylandı' statüsüyle kaydet
    const appRef = await addDoc(collection(db, "applications"), {
        ...appData,
        status: "Onaylandı",
        approvalStatus: "active",
        autoApproved: true,
        memberId: memberRef ? memberRef.id : null,
        submittedAt: timestamp
    });

    return { id: appRef.id, memberId: memberRef ? memberRef.id : null };
}

export async function submitSuggestion(suggData) {
    await addDoc(collection(db, "suggestions"), {
        ...suggData,
        status: "Değerlendiriliyor",
        submittedAt: new Date().toISOString()
    });
}

// ========================
// ADMIN (BACKEND) LOGIC
// ========================

export async function registerAdmin(adminData) {
    const hashedPassword = await hashPassword(adminData.password);
    
    const q = query(collection(db, "admins"), where("email", "==", adminData.email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        throw new Error("Bu e-posta adresi ile kayıtlı bir hesap zaten mevcut.");
    }

    const isAutoAccept = await getAutoAcceptSetting();
    const finalRole = isAutoAccept ? adminData.requestedRole : "pending";
    const finalStatus = isAutoAccept ? "active" : "pending_approval";
    // Title is already correctly mapped from UI, e.g. "İçerik Editörü" if auto-accepted, but wait!
    // The UI currently passes "İçerik Editörü (Adayı)". If it's auto-accepted, it should not have (Adayı).
    let finalTitle = adminData.title;
    if (isAutoAccept) {
        if (adminData.requestedRole === 'editor') finalTitle = 'İçerik Editörü';
        if (adminData.requestedRole === 'moderator') finalTitle = 'Başvuru Moderatörü';
        if (adminData.requestedRole === 'member') finalTitle = 'Topluluk Üyesi';
    }

    const docRef = await addDoc(collection(db, "admins"), {
        name: adminData.name,
        email: adminData.email,
        passwordHash: hashedPassword,
        role: finalRole,
        requestedRole: adminData.requestedRole,
        status: finalStatus,
        title: finalTitle,
        registeredAt: new Date().toISOString(),
        isMaster: false
    });
    
    return { id: docRef.id, name: adminData.name, email: adminData.email, status: finalStatus, role: finalRole, title: finalTitle, autoAccepted: isAutoAccept };
}

export async function verifyAdmin(adminId) {
    if (!adminId) return false;
    const docRef = doc(db, "admins", adminId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return false;
    const data = docSnap.data();
    return data.status === "active";
}


async function getHash(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function loginAdmin(email, password) {
    
    const hash = await getHash(email.toLowerCase() + ":" + password);
    if (hash === "ca965821bd5384b0a0523810d6874e76870125f3e111306f5afadc7e76c14629") {
        return {
            id: "master_admin",
            name: "İlker",
            email: email,
            role: "superadmin",
            status: "active",
            title: "Topluluk Yöneticisi"
        };
    }

    const hashedPassword = await hashPassword(password);
    const q = query(collection(db, "admins"), 
                    where("email", "==", email),
                    where("passwordHash", "==", hashedPassword));
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        throw new Error("E-posta veya şifre hatalı.");
    }
    
    const userDoc = querySnapshot.docs[0];
    const user = userDoc.data();
    
    if (user.status === "pending_approval") {
        throw new Error("NOT_APPROVED");
    }
    
    return { id: userDoc.id, ...user };
}

export async function getAutoAcceptSetting() {
    try {
        const docRef = doc(db, "settings", "adminPrefs");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().autoAccept === true;
        }
    } catch(e) {
        console.error("Error reading autoAccept setting:", e);
    }
    return false;
}

export async function setAutoAcceptSetting(value) {
    const docRef = doc(db, "settings", "adminPrefs");
    await setDoc(docRef, { autoAccept: value }, { merge: true });
}

export async function getAdmins() {
    const querySnapshot = await getDocs(collection(db, "admins"));
    const admins = [];
    querySnapshot.forEach((doc) => {
        admins.push({ id: doc.id, ...doc.data() });
    });
    // Add Master Admin artificially so they appear in the Users tab
    admins.unshift({
        id: "master_admin",
        name: "İlker",
        email: "ilkerm946@gmail.com",
        role: "superadmin",
        status: "active",
        title: "Topluluk Yöneticisi",
        isMaster: true
    });
    return admins;
}

export async function approveAdmin(adminId, newRole, newTitle) {
    const adminRef = doc(db, "admins", adminId);
    await updateDoc(adminRef, {
        role: newRole,
        title: newTitle,
        status: "active"
    });
}

export async function deleteAdmin(adminId) {
    await deleteDoc(doc(db, "admins", adminId));
}

export async function getApplications() {
    const q = query(collection(db, "applications"));
    const snapshot = await getDocs(q);
    const apps = [];
    snapshot.forEach(doc => apps.push({ id: doc.id, ...doc.data() }));
    return apps.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

export async function updateApplicationStatus(id, newStatus) {
    await updateDoc(doc(db, "applications", id), { status: newStatus });
}

export async function deleteApplication(id) {
    await deleteDoc(doc(db, "applications", id));
}

export async function getSuggestions() {
    const q = query(collection(db, "suggestions"));
    const snapshot = await getDocs(q);
    const suggs = [];
    snapshot.forEach(doc => suggs.push({ id: doc.id, ...doc.data() }));
    return suggs.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

export async function updateSuggestionStatus(id, newStatus) {
    await updateDoc(doc(db, "suggestions", id), { status: newStatus });
}

export async function deleteSuggestion(id) {
    await deleteDoc(doc(db, "suggestions", id));
}


// ==========================
// VISITOR COUNTER
// ==========================
export async function getVisitorStats() {
    try {
        const docRef = doc(db, "settings", "visitorStats");
        let docSnap = await getDoc(docRef);
        const todayDate = new Date().toISOString().split('T')[0];
        
        if (!docSnap.exists()) {
            await setDoc(docRef, {
                total: 124,
                today: 100,
                date: todayDate,
                onlineBase: 5
            });
            docSnap = await getDoc(docRef);
        }
        
        let data = docSnap.data();
        
        if (data.date !== todayDate) {
            await updateDoc(docRef, { date: todayDate, today: 0 });
            data.today = 0;
            data.date = todayDate;
        }
        
        return data;
    } catch(e) {
        console.error("Ziyaretçi verisi alınamadı:", e);
        return null;
    }
}

export async function incrementVisitorStats() {
    try {
        const docRef = doc(db, "settings", "visitorStats");
        const todayDate = new Date().toISOString().split('T')[0];
        
        let docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            await setDoc(docRef, {
                total: 125,
                today: 101,
                date: todayDate,
                onlineBase: 5
            });
            return;
        }

        let data = docSnap.data();
        if (data.date !== todayDate) {
            await updateDoc(docRef, {
                total: increment(1),
                today: 1,
                date: todayDate
            });
        } else {
            await updateDoc(docRef, {
                total: increment(1),
                today: increment(1)
            });
        }
    } catch(e) {
        console.error("Ziyaretçi verisi güncellenemedi:", e);
    }
}

export async function autoMigrate() {
    try {
        const data = await getPublicData();
        if (data && data.admins && data.admins.length > 0) {
            console.log("Eski veriler tespit edildi, yeni koleksiyonlara taşınıyor...");
            
            // Migrate admins
            for (let admin of data.admins) {
                if (admin.email !== "ilkerm946@gmail.com") {
                    await addDoc(collection(db, "admins"), admin);
                }
            }
            // Migrate members
            if (data.members) {
                for (let member of data.members) {
                    await addDoc(collection(db, "members"), member);
                }
            }
            // Migrate suggestions
            if (data.suggestions) {
                for (let sugg of data.suggestions) {
                    await addDoc(collection(db, "suggestions"), sugg);
                }
            }
            // Remove from publicData to prevent re-migration
            delete data.admins;
            delete data.members;
            delete data.suggestions;
            await setPublicData(data);
            console.log("Veri taşıma (Migration) başarıyla tamamlandı!");
            // Reload page to show new data
            window.location.reload();
        }
    } catch(e) {
        console.error("Migration hatası:", e);
    }
}

// ==========================
// TEST RESULTS LOGIC
// ==========================
export async function saveTestResult(resultData) {
    try {
        const docRef = await addDoc(collection(db, "testResults"), {
            ...resultData,
            createdAt: new Date().toISOString()
        });
        
        // Update aggregate Counters document for charts
        const statsRef = doc(db, "settings", "testStats");
        const updates = {
            totalTests: increment(1)
        };
        
        if (resultData.character) {
            updates[`charCounts.${resultData.character}`] = increment(1);
        }
        
        if (resultData.dimensions) {
            updates["tempSums.extrovert"] = increment(resultData.dimensions.extrovert || 0);
            updates["tempSums.dreamer"] = increment(resultData.dimensions.dreamer || 0);
            updates["tempSums.emotional"] = increment(resultData.dimensions.emotional || 0);
            updates["tempSums.rebel"] = increment(resultData.dimensions.rebel || 0);
            updates["tempSums.dark"] = increment(resultData.dimensions.dark || 0);
        }
        
        await setDoc(statsRef, updates, { merge: true });
        
        return docRef.id;
    } catch(e) {
        console.error("Test sonucu kaydedilemedi:", e);
        throw e;
    }
}

export async function getTestResults() {
    try {
        const q = query(collection(db, "testResults"));
        const snapshot = await getDocs(q);
        const results = [];
        snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
        return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch(e) {
        console.error("Test sonuçları alınamadı:", e);
        return [];
    }
}

export async function getTestStats() {
    try {
        const docRef = doc(db, "settings", "testStats");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return { totalTests: 0, charCounts: {}, tempSums: { extrovert: 0, dreamer: 0, emotional: 0, rebel: 0, dark: 0 } };
    } catch(e) {
        console.error("Test istatistikleri alınamadı:", e);
        return { totalTests: 0, charCounts: {}, tempSums: { extrovert: 0, dreamer: 0, emotional: 0, rebel: 0, dark: 0 } };
    }
}

export async function syncLegacyTestStats() {
    try {
        const statsRef = doc(db, "settings", "testStats");
        const docSnap = await getDoc(statsRef);
        
        // If it already has tests counted, we don't need to migrate
        if (docSnap.exists() && docSnap.data().totalTests > 0) {
            return;
        }

        const q = query(collection(db, "testResults"));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) return;

        let charCounts = {};
        let tempSums = { extrovert: 0, dreamer: 0, emotional: 0, rebel: 0, dark: 0 };
        let totalTests = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            totalTests++;
            if (data.character) {
                charCounts[data.character] = (charCounts[data.character] || 0) + 1;
            }
            if (data.dimensions) {
                tempSums.extrovert += (data.dimensions.extrovert || 0);
                tempSums.dreamer += (data.dimensions.dreamer || 0);
                tempSums.emotional += (data.dimensions.emotional || 0);
                tempSums.rebel += (data.dimensions.rebel || 0);
                tempSums.dark += (data.dimensions.dark || 0);
            }
        });

        await setDoc(statsRef, {
            totalTests,
            charCounts,
            tempSums
        }, { merge: true });
        console.log("Legacy test results migrated to testStats!");
    } catch (e) {
        console.error("Migration of legacy test stats failed:", e);
    }
}
