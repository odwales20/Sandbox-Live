const path = new URL('./signage/', import.meta.url);

export async function loadPlaylist() {
  const response = await fetch(new URL('images.json', path), {cache: 'no-store'});
  if (!response.ok) throw new Error('Could not load the signage playlist.');
  const files = await response.json();
  return Array.isArray(files) ? files.filter(file => typeof file === 'string' && !/[/\\]/.test(file)) : [];
}

export function imageUrl(file) {
  return new URL(encodeURIComponent(file), path).href;
}
