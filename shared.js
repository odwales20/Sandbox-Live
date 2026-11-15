import {firebaseConfig} from './firebase-config.js';
export const DEMO_KEY='sandbox-live-demo-v1';
export const defaultState=()=>({status:'idle',durationSeconds:600,remainingSeconds:600,endAt:null,finishAt:null,roundName:'Truck Challenge',trucks:[{id:'22',name:'Truck 22'},{id:'23',name:'Truck 23'}],loads:[],updatedAt:Date.now()});
export const configured=!!(firebaseConfig&&firebaseConfig.projectId&&firebaseConfig.apiKey);
export const weightUnits=(lb,oz)=>Math.round((Number(lb)*16+Number(oz))*10);
export const displayWeight=(units)=>{const u=Math.max(0,Math.round(units));return {lb:Math.floor(u/160),oz:((u%160)/10).toFixed(1)}};
export const truckTotals=s=>s.trucks.map(t=>{const loads=s.loads.filter(l=>l.truckId===t.id);return {...t,loads:loads.length,total:loads.reduce((v,l)=>v+weightUnits(l.lb,l.oz),0)}}).sort((a,b)=>b.total-a.total);
export function remainingSeconds(s){if(s.status==='running'&&s.endAt)return Math.max(0,Math.ceil((s.endAt-Date.now())/1000));return Math.max(0,Number(s.remainingSeconds)||0)}
export function cleanState(s){return {...defaultState(),...(s||{})};}
export async function connect(onState){if(!configured){const update=()=>onState(cleanState(JSON.parse(localStorage.getItem(DEMO_KEY)||'null')));window.addEventListener('storage',update);update();return {mode:'demo',save:async s=>{localStorage.setItem(DEMO_KEY,JSON.stringify(s));onState(cleanState(s))},signIn:async()=>{throw Error('Configure Firebase first')},signOut:async()=>{},onAuth:fn=>fn(null)}};
const [{initializeApp},{getFirestore,doc,onSnapshot,setDoc},{getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged}]=await Promise.all([import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js'),import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js')]);
const app=initializeApp(firebaseConfig);const db=getFirestore(app);const auth=getAuth(app);const ref=doc(db,'sandboxLive','current');
onSnapshot(ref,snap=>onState(cleanState(snap.exists()?snap.data():null)),err=>console.error('Firebase subscription error:',err));
return {mode:'firebase',save:async s=>{if(!auth.currentUser)throw Error('Sign in to edit scores');await setDoc(ref,{...s,updatedAt:Date.now()})},signIn:async(email,password)=>signInWithEmailAndPassword(auth,email,password),signOut:async()=>signOut(auth),onAuth:fn=>onAuthStateChanged(auth,fn)};
}
