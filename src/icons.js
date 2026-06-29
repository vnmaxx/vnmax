// Conjunto minimo de icones (stroke style) usados na interface.
const P = {
  bolt: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/>',
  gauge: '<path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M13.4 12.6 19 7"/><path d="M3 18a9 9 0 0 1 18 0"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
  shield: '<path d="M12 3 5 6v6c0 4 3 6.5 7 8 4-1.5 7-4 7-8V6l-7-3z"/><path d="m9 12 2 2 4-4"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 14v4M12 9v9M17 5v13"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/>',
  code: '<path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 6l-4 12"/>',
  window: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M7 6.5h.01M10 6.5h.01"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
  cloud: '<path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.2A3.5 3.5 0 0 1 17 18H7z"/>',
  rocket: '<path d="M5 15c-1 1-1.5 4-1.5 4s3-.5 4-1.5M9 11a8 8 0 0 1 8-8c2 0 3 1 3 3a8 8 0 0 1-8 8l-3-3z"/><path d="M14 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="17.2" cy="6.8" r="1"/>',
  tiktok: '<path d="M13.5 4c.4 2.6 2 4.2 4.5 4.6"/><path d="M13.5 4v9.8a3.6 3.6 0 1 1-3.3-3.59"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7.4 10.5v6.1"/><circle cx="7.4" cy="7.5" r="1"/><path d="M11.4 16.6v-3.3a2.1 2.1 0 0 1 4.2 0v3.3"/><path d="M11.4 16.6v-6.1"/>',
  bluesky: '<path d="M12 11C10.3 7.7 7.2 5.8 5.9 6.8c-1.2 1 -.3 3.4 1.8 4.2-1.9.1-2.8 1-2.2 2.4.6 1.4 3.6 1.2 5.4-1 .5-.7.8-1.2 1.1-1.7.3.5.6 1 1.1 1.7 1.8 2.2 4.8 2.4 5.4 1 .6-1.4-.3-2.3-2.2-2.4 2.1-.8 3-3.2 1.8-4.2C16.8 5.8 13.7 7.7 12 11z"/>',
  youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10.4 9.2 5.2 2.8-5.2 2.8z"/>',
};

export function icon(name) {
  const body = P[name] || P.spark;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
