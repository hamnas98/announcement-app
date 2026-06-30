

(function () {
  const banner = document.getElementById('announcement-banner');
  if (!banner) return;

  const text = banner.querySelector('.announcement-banner__text')?.textContent?.trim();
  const storageKey = 'announcement_closed_' + btoa(encodeURIComponent(text || '')).slice(0, 24);

  if (sessionStorage.getItem(storageKey)) {
    banner.style.display = 'none';
    return;
  }


  const closeBtn = banner.querySelector('.announcement-banner__close');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      banner.style.display = 'none';
      sessionStorage.setItem(storageKey, '1');
    });
  }
})();