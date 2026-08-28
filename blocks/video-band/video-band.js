/**
 * video-band — full-width video on a colored band (template-slotted replica).
 * Variant: `sky` (default).
 *
 * The video URL is authored as a plain link in the section's leading
 * DEFAULT CONTENT (D1); the block reabsorbs it (section-head pattern).
 */
export default async function decorate(block) {
  // reabsorb the video link from the section's leading default content
  let videoA = null;
  const prev = block.parentElement && block.parentElement.previousElementSibling;
  if (prev && prev.matches('.default-content-wrapper')) {
    videoA = [...prev.querySelectorAll('a')].find((a) => /youtube\.com|youtu\.be|vimeo\.com/.test(a.href));
    if (videoA) { videoA = videoA.cloneNode(true); prev.remove(); }
  }
  if (!videoA) videoA = [...block.querySelectorAll('a')].find((a) => /youtube\.com|youtu\.be|vimeo\.com/.test(a.href));

  const spacer = document.createElement('div');
  spacer.className = 'richtext br-spacer';
  const sp = document.createElement('p');
  sp.innerHTML = '<br>\n<br>\n ';
  spacer.append(sp);

  const embed = document.createElement('div');
  embed.className = 'youtubeEmbed';
  if (videoA) {
    const iframe = document.createElement('iframe');
    iframe.src = videoA.href;
    iframe.title = videoA.textContent.trim() || 'video';
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('loading', 'lazy');
    embed.append(iframe);
  }
  const col = document.createElement('div');
  col.className = 'video-col';
  col.append(embed);
  const row = document.createElement('div');
  row.className = 'video-row';
  row.append(col);
  const wrap = document.createElement('div');
  wrap.className = 'youtube';
  wrap.append(row);

  block.replaceChildren(spacer, wrap);
}
