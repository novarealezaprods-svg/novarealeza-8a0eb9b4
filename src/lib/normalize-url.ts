// Converts share URLs (Dropbox, Google Drive) to direct hotlinkable URLs.
// For Dropbox we keep the original host (www.dropbox.com) and only normalize
// the query string to use `raw=1`, which tells Dropbox to stream the raw file
// instead of returning the HTML preview page. Rewriting the host to
// dl.dropboxusercontent.com no longer works for /scl/fi/ links — that path
// returns 404 there.
export function normalizeDirectUrl(url: string): string {
  if (!url) return url;
  if (/dropbox\.com/.test(url)) {
    let u = url;
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
