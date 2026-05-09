import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

// Read config
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const usersToCreate = [
  { email: 'admin@syncai.com', password: 'password123', name: 'Superuser Admin', role: 'admin' },
  { email: 'lead@syncai.com', password: 'password123', name: 'Team Lead', role: 'team_lead' },
  { email: 'employee1@syncai.com', password: 'password123', name: 'Employee One', role: 'member' },
  { email: 'employee2@syncai.com', password: 'password123', name: 'Employee Two', role: 'member' },
  { email: 'employee3@syncai.com', password: 'password123', name: 'Employee Three', role: 'member' },
];

async function seed() {
  for (const u of usersToCreate) {
    try {
      console.log(`Creating ${u.email}...`);
      const userCredential = await createUserWithEmailAndPassword(auth, u.email, u.password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: u.name });
      
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: Date.now()
      });
      console.log(`Created ${u.email} successfully.`);
      await signOut(auth);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        console.log(`User ${u.email} already exists. Attempting to sign in to update...`);
        try {
          const uc = await signInWithEmailAndPassword(auth, u.email, u.password);
          await setDoc(doc(db, 'users', uc.user.uid), {
            uid: uc.user.uid,
            email: u.email,
            name: u.name,
            role: u.role,
            createdAt: Date.now()
          });
          console.log(`Updated ${u.email} successfully.`);
          await signOut(auth);
        } catch (signInErr) {
          console.error(`Could not update existing user ${u.email}:`, signInErr);
        }
      } else {
        console.error(`Error creating ${u.email}:`, err);
      }
    }
  }
  process.exit(0);
}

seed();
