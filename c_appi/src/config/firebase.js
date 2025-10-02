// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'
//import { getAnalytics } from "firebase/analytics";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCFAR2IzYjdH1r7J8hIIBE8RaTtkUslA3s",
  authDomain: "plantaaguamanantial.firebaseapp.com",
  projectId: "plantaaguamanantial",
  storageBucket: "plantaaguamanantial.firebasestorage.app",
  messagingSenderId: "460316804769",
  appId: "1:460316804769:web:be33fb9886b845125a12e0",
  measurementId: "G-6G61RB8MJ0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

//const analytics = getAnalytics(app);