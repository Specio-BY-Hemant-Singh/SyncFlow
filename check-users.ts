import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc } from 'firebase/firestore';
import fs from 'fs';

// Read config
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check() {
  const snapshot = await getDocs(collection(db, 'users'));
  console.log('Users in Firestore:');
  snapshot.forEach(doc => {
    console.log(doc.id, doc.data().email, doc.data().role);
  });
  
  process.exit(0);
}

check().catch(console.error);
