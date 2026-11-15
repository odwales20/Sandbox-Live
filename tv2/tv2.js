import {watchBuild} from '../updates.js';
import {connect} from '../shared.js?v=2';
import {imageUrl, loadPlaylist} from '../signage.js';

const image = document.getElementById('slide');
const message = document.getElementById('message');
let images = [];
let index = 0;
let pinnedImage = null;

function show(file) {
  image.hidden = !file;
  message.hidden = !!file;
  if (file) image.src = imageUrl(file);
}

function advance() {
  if (pinnedImage && images.includes(pinnedImage)) {
    const url = imageUrl(pinnedImage);
    if (image.src !== url || image.hidden) show(pinnedImage);
    return;
  }
  show(images.length ? images[index++ % images.length] : null);
}

async function refresh() {
  try {
    images = await loadPlaylist();
  } catch (error) {
    console.warn('No signage playlist available', error);
  }
}

image.onerror = () => show(null);
connect(null, file => {
  if (pinnedImage === file) return;
  pinnedImage = file;
  advance();
}).catch(error => console.error('TV2 sync:', error));

await refresh();
advance();
setInterval(advance, 10000);
setInterval(async () => { await refresh(); if (pinnedImage) advance(); }, 60000);

watchBuild();
