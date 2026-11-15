import {firebaseConfig} from './firebase-config.js?v=2';

export const DEMO_KEY = 'sandbox-live-demo-v1';
const DEMO_SIGNAGE_KEY = 'sandbox-live-tv2-v1';
export const defaultState=()=>({status:'idle',durationSeconds:600,remainingSeconds:600,endAt:null,finishAt:null,roundName:'Truck Challenge',trucks:[{id:'22',name:'Truck 22'},{id:'23',name:'Truck 23'}],loads:[],updatedAt:Date.now()});
export const configured=!!(firebaseConfig&&firebaseConfig.projectId&&firebaseConfig.apiKey);
export const weightUnits=(lb,oz)=>Math.round((Number(lb)*16+Number(oz))*10);
export const displayWeight=(units)=>{const u=Math.max(0,Math.round(units));return {lb:Math.floor(u/160),oz:((u%160)/10).toFixed(1)}};
export const truckTotals=s=>s.trucks.map(t=>{const loads=s.loads.filter(l=>l.truckId===t.id);return {...t,loads:loads.length,total:loads.reduce((v,l)=>v+weightUnits(l.lb,l.oz),0)}}).sort((a,b)=>b.total-a.total);
export function remainingSeconds(s){if(s.status==='running'&&s.endAt)return Math.max(0,Math.ceil((s.endAt-Date.now())/1000));return Math.max(0,Number(s.remainingSeconds)||0)}
export function cleanState(s){return {...defaultState(),...(s||{})};}

export async function connect(onState, onSignage, onError = console.error) {
  if (!configured) {
    const update = () => {
      onState?.(cleanState(JSON.parse(localStorage.getItem(DEMO_KEY) || 'null')));
      onSignage?.(localStorage.getItem(DEMO_SIGNAGE_KEY));
    };
    window.addEventListener('storage', update);
    update();
    return {
      mode: 'demo',
      save: async state => {
        localStorage.setItem(DEMO_KEY, JSON.stringify(state));
        onState?.(cleanState(state));
      },
      saveSignage: async file => {
        if (file) localStorage.setItem(DEMO_SIGNAGE_KEY, file);
        else localStorage.removeItem(DEMO_SIGNAGE_KEY);
        onSignage?.(file);
      },
      onAuth: callback => callback(null)
    };
  }

  const [{initializeApp}, {getFirestore, doc, onSnapshot, setDoc}, authSdk] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js'),
    onState && onSignage ? import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js') : null
  ]);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const current = doc(db, 'sandboxLive', 'current');
  const signage = doc(db, 'sandboxLive', 'tv2');

  if (onState) onSnapshot(current, snap => onState(cleanState(snap.data())), onError);
  if (onSignage) onSnapshot(signage, snap => onSignage(snap.data()?.image ?? null), onError);

  if (!authSdk) return {mode: 'firebase'};
  const auth = authSdk.getAuth(app);
  return {
    mode: 'firebase',
    save: async state => setDoc(current, {...state, updatedAt: Date.now()}),
    saveSignage: async image => setDoc(signage, {image}),
    signIn: (email, password) => authSdk.signInWithEmailAndPassword(auth, email, password),
    resetPassword: email => authSdk.sendPasswordResetEmail(auth, email),
    verifyResetCode: code => authSdk.verifyPasswordResetCode(auth, code),
    confirmPasswordReset: (code, password) => authSdk.confirmPasswordReset(auth, code, password),
    signOut: () => authSdk.signOut(auth),
    onAuth: callback => authSdk.onAuthStateChanged(auth, callback)
  };
}
