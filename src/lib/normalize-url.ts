// Converts share URLs (Dropbox, Google Drive) to direct hotlinkable URLs.
// www.dropbox.com returns an HTML preview, so <img>/<video> fail to load.
// We rewrite to dl.dropboxusercontent.com, which serves the raw binary.
export function normalizeDirectUrl(url: string): string {
  if (!url) return url;
  if (/dropbox\.com/.test(url)) {
    let u = url
      .replace("https://www.dropbox.com", "https://dl.dropboxusercontent.com")
      .replace("http://www.dropbox.com", "https://dl.dropboxusercontent.com");
    // Strip any existing dl=/raw= params, then force raw=1 once.
    u = u.replace(/([?&])(dl|raw)=[01]/g, "$1");
    u = u.replace(/[?&]+$/, "").replace(/&&+/g, "&").replace(/\?&/, "?");
    u += (u.includes("?") ? "&" : "?") + "raw=1";
    return u;
  }
  const gd = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (gd) return `https://drive.google.com/uc?export=download&id=${gd[1]}`;
  return url;
}
