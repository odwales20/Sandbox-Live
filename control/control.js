import {watchBuild} from '../updates.js';
import {firebaseConfig} from '../firebase-config.js?v=2';
import {loadPlaylist} from '../signage.js';
import {connect,configured,defaultState,cleanState,displayWeight,truckTotals,remainingSeconds} from '../shared.js?v=4';
const el=id=>document.getElementById(id);let state=defaultState(),api=null,allowed=!configured,syncing=false;
let signedIn = false;
let pendingActions = 0;

async function trackAction(action) {
  pendingActions++;
  try {
    return await action();
  } finally {
    pendingActions--;
  }
}

watchBuild(() => pendingActions === 0 && !resetAccount
  && !document.activeElement?.matches('input, select, textarea'));
const setError=msg=>el('error').textContent=msg||'';
const labelTime=sec=>`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;
const canWrite=()=>{if(!allowed){setError('Sign in to change the competition.');return false}return true};
async function save(next){if(!canWrite())return;setError('');const previous=state;state=next;render();try{await trackAction(() => api.save(next))}catch(e){state=previous;render();setError(e.message||String(e))}}
function onState(s){if(document.activeElement?.tagName==='INPUT'&&['pounds','ounces','newTruck','email','password','roundName','duration'].includes(document.activeElement.id)){state=s;render(false)}else{state=s;render(true)}}
function render(refreshForm=true){el('status').textContent=state.status.toUpperCase();el('timer').textContent=labelTime(remainingSeconds(state));if(refreshForm){el('roundName').value=state.roundName||'';el('duration').value=Math.round(state.durationSeconds/60)||10}const trucks=truckTotals(state);const selection=el('truck').value;el('truck').innerHTML=state.trucks.map(t=>`<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}</option>`).join('');if(state.trucks.some(t=>t.id===selection))el('truck').value=selection;el('scores').innerHTML=trucks.map((t,i)=>{const w=displayWeight(t.total);return `<div class="score ${i===0&&t.total>0?'leader':''}"><div>${i===0&&t.total>0?'🏆 ':''}${escapeHtml(t.name)}</div><strong>${w.lb} lb ${w.oz} oz</strong><span class="subtle">${t.loads} loads</span></div>`}).join('');el('loadCount').textContent=`(${state.loads.length})`;el('loads').innerHTML=state.loads.slice().reverse().map(l=>`<tr data-id="${escapeHtml(l.id)}"><td><select class="load-truck">${state.trucks.map(t=>`<option value="${escapeHtml(t.id)}" ${t.id===l.truckId?'selected':''}>${escapeHtml(t.name)}</option>`).join('')}</select></td><td><input class="load-lb" type="number" min="0" step="1" value="${escapeHtml(l.lb)}"></td><td><input class="load-oz" type="number" min="0" max="15.9" step=".1" value="${escapeHtml(l.oz)}"></td><td><button class="danger delete" aria-label="Delete load">✕</button></td></tr>`).join('');el('operations').hidden=!allowed;el('authPanel').hidden=!configured||signedIn;el('signOut').hidden=!signedIn}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]))}
function weightOK(lb,oz){return Number.isInteger(Number(lb))&&String(lb).trim()!==''&&Number(lb)>=0&&Number(lb)<=9999&&Number.isFinite(Number(oz))&&String(oz).trim()!==''&&Number(oz)>=0&&Number(oz)<16&&Math.round(Number(oz)*10)===Number(oz)*10}
function updated(changes){return {...state,...changes,updatedAt:Date.now()}}
el('loadForm').addEventListener('submit',e=>{e.preventDefault();const lb=el('pounds').value,oz=el('ounces').value;if(!weightOK(lb,oz)){setError('Enter whole pounds and ounces from 0.0 to 15.9 in 0.1 oz steps.');return}save(updated({loads:[...state.loads,{id:crypto.randomUUID(),truckId:el('truck').value,lb:Number(lb),oz:Number(oz)}]})).then(()=>{el('pounds').value='';el('ounces').value='';el('pounds').focus()})});
el('addTruckForm').addEventListener('submit',e=>{e.preventDefault();const name=el('newTruck').value.trim();if(!name)return;if(state.trucks.some(t=>t.name.toLowerCase()===name.toLowerCase())){setError('That truck already exists.');return}save(updated({trucks:[...state.trucks,{id:crypto.randomUUID(),name}]})).then(()=>el('newTruck').value='')});
el('loads').addEventListener('click',e=>{const row=e.target.closest('tr');if(!row||!e.target.classList.contains('delete'))return;save(updated({loads:state.loads.filter(l=>l.id!==row.dataset.id)}))});
el('loads').addEventListener('change',e=>{const row=e.target.closest('tr');if(!row)return;const lb=row.querySelector('.load-lb').value,oz=row.querySelector('.load-oz').value,truckId=row.querySelector('.load-truck').value;if(!weightOK(lb,oz)){setError('Invalid weight; ounces must be 0.0–15.9.');render();return}save(updated({loads:state.loads.map(l=>l.id===row.dataset.id?{...l,truckId,lb:Number(lb),oz:Number(oz)}:l)}))});
el('start').onclick=()=>{const duration=Math.round(Number(el('duration').value)*60);if(!Number.isFinite(duration)||duration<60||duration>14400){setError('Set a timer between 1 and 240 minutes.');return}const title=el('roundName').value.trim()||'Truck Challenge';save(updated({roundName:title,durationSeconds:duration,remainingSeconds:duration,endAt:Date.now()+duration*1000,status:'running'}))};
el('pause').onclick=()=>{if(state.status==='running')save(updated({remainingSeconds:remainingSeconds(state),endAt:null,status:'paused'}))};
el('resume').onclick=()=>{if(state.status==='paused')save(updated({endAt:Date.now()+state.remainingSeconds*1000,status:'running'}))};
el('finish').onclick=()=>{if(state.status!=='idle')save(updated({remainingSeconds:remainingSeconds(state),endAt:null,status:'finished',finishAt:Date.now()}))};
el('reset').onclick=()=>{if(!confirm('Clear all competition scores and return TV1 to adverts?'))return;const next=defaultState();save(next)};
el('authForm').onsubmit=async e=>{e.preventDefault();setError('');try{await trackAction(() => api.signIn(el('email').value.trim(),el('password').value));el('password').value=''}catch(err){setError(err.message)}};
el('signOut').onclick=()=>trackAction(() => api.signOut()).catch(e=>setError(e.message));
setInterval(()=>{el('timer').textContent=labelTime(remainingSeconds(state));if(state.status==='running'&&remainingSeconds(state)===0&&allowed&&!syncing){syncing=true;save(updated({status:'finished',remainingSeconds:0,endAt:null,finishAt:Date.now()})).finally(()=>syncing=false)}},500);
let resetAccount = null;
const resetStatus = message => { el('resetStatus').textContent = message; };

function resetError(error) {
  if (error.code === 'auth/expired-action-code' || error.code === 'auth/invalid-action-code') {
    return 'This reset link is expired or has already been used. Request a new one above.';
  }
  return error.message;
}

el('repairReset').onsubmit = async event => {
  event.preventDefault();
  resetAccount = null;
  el('newPasswordForm').reset();
  el('newPasswordForm').hidden = true;
  const input = el('resetLink');
  let link;
  try {
    link = new URL(input.value.trim());
  } catch {
    resetStatus('Paste the full Sandbox Live password reset link from your email.');
    return;
  }
  const code = link.searchParams.get('oobCode');
  if (link.origin !== `https://${firebaseConfig.authDomain}`
    || link.pathname !== '/__/auth/action'
    || link.searchParams.get('mode') !== 'resetPassword'
    || !code) {
    resetStatus('Paste the full Sandbox Live password reset link from your email.');
    return;
  }

  const button = event.submitter;
  button.disabled = true;
  resetStatus('Verifying reset link…');
  try {
    const email = await trackAction(() => api.verifyResetCode(code));
    resetAccount = {code, email};
    input.value = '';
    el('newPasswordForm').hidden = false;
    resetStatus('Enter your new password below.');
    el('newPassword').focus();
  } catch (error) {
    resetStatus(resetError(error));
  } finally {
    button.disabled = false;
  }
};

el('newPasswordForm').onsubmit = async event => {
  event.preventDefault();
  if (!resetAccount) return;
  const {code, email} = resetAccount;
  const password = el('newPassword').value;
  if (password !== el('confirmPassword').value) {
    resetStatus('The two passwords must match.');
    return;
  }

  const button = event.submitter;
  const verifyButton = el('repairReset').querySelector('button');
  button.disabled = verifyButton.disabled = true;
  try {
    await trackAction(() => api.confirmPasswordReset(code, password));
    resetAccount = null;
    el('newPasswordForm').reset();
    el('newPasswordForm').hidden = true;
    el('email').value = email;
    resetStatus('Password saved. Sign in above with your new password.');
  } catch (error) {
    resetStatus(resetError(error));
  } finally {
    button.disabled = verifyButton.disabled = false;
  }
};


let signageImage = null;
let playlist = [];
function onSignage(file) {
  signageImage = file;
  el('tv2Image').value = playlist.includes(file) ? file : '';
}

async function refreshPlaylist() {
  try {
    const files = await loadPlaylist();
    const select = el('tv2Image');
    if (select === document.activeElement) return;
    if (JSON.stringify(files) === JSON.stringify(playlist)) return;
    playlist = files;
    select.replaceChildren(new Option('Rotate slideshow', ''),
      ...playlist.map(file => new Option(file, file)));
    onSignage(signageImage);
  } catch (error) {
    console.warn('TV2 playlist:', error);
  }
}
refreshPlaylist();
setInterval(refreshPlaylist, 60000);

el('tv2Form').onsubmit = async event => {
  event.preventDefault();
  if (!canWrite()) return;
  try {
    setError('');
    await trackAction(() => api.saveSignage(el('tv2Image').value || null));
  } catch (error) {
    setError(error.message);
  }
};

el('resetPassword').onclick = async () => {
  const email = el('email');
  if (!email.reportValidity()) return;
  try {
    setError('');
    await trackAction(() => api.resetPassword(email.value.trim()));
    el('authMessage').textContent = 'Check your inbox for a password setup link. Copy the link from the email and paste it under Reset password here.';
  } catch (error) {
    setError(error.message);
  }
};

(async()=>{try{api=await connect(onState, onSignage, error => setError(error.message));el('connection').textContent=api.mode==='firebase'?'Firebase connected':'Local demo mode';el('mode').textContent=api.mode==='firebase'?'Competition changes appear live on TV1 and advert selections on TV2.':'Scores save in this browser only. Configure Firebase to sync phones and TVs.';api.onAuth(user => {
  signedIn = !!user;
  allowed = signedIn || api.mode === 'demo';
  if (signedIn) {
    resetAccount = null;
    el('authForm').reset();
    el('repairReset').reset();
    el('newPasswordForm').reset();
    el('newPasswordForm').hidden = true;
    el('resetDetails').open = false;
    el('authMessage').textContent = '';
    resetStatus('');
  }
  render();
});render()}catch(e){el('connection').textContent='Connection failed';setError(e.message||String(e))}})();
