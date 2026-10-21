(() => {
  const routeName=location.pathname.replace(/\/+$/,'').split('/').pop()||'home';
  const page=({workbench:'workbench.html',ghostkernel:'ghostkernel.html',course:'course.html',profile:'profile.html',community:'community.html',templates:'templates.html',docs:'docs.html'})[routeName]||({workbench:'workbench',ghostkernel:'ghostkernel',course:'course',profile:'profile',community:'community',templates:'templates',docs:'docs'})[routeName]||'home';
  fetch('/api/telemetry', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'page',label:page}),keepalive:true}).catch(()=>{});
  const footer=document.querySelector('.dw-site-footer'),bottom=footer?.querySelector('.dw-footer-bottom');
  if(bottom){const notice=document.createElement('p');notice.className='dw-telemetry-note';notice.textContent='PRIVACY SIGNAL / aggregate page and run totals only · no source code or account identity stored';footer.insertBefore(notice,bottom)}

  fetch('/api/site/config', {cache:'no-store'})
    .then(response => response.ok ? response.json() : null)
    .then(config => {
      if (!config) return;
      window.darkwaveSiteConfig = config;
      document.dispatchEvent(new CustomEvent('darkwave:site-config', {detail:config}));
      for (const card of document.querySelectorAll('.track-card[data-track]')) {
        card.hidden = !config.visibleCourses.includes(card.dataset.track);
      }
      if (page === 'course') {
        const track = new URLSearchParams(location.search).get('track');
        if (track && !config.visibleCourses.includes(track)) {
          document.querySelector('#courseTitle').textContent = 'TRACK CURRENTLY OFFLINE';
          document.querySelector('#courseIntro').textContent = 'This learning track is temporarily unavailable. Browse the other active tracks from the home page.';
          document.querySelector('.course-layout')?.setAttribute('hidden','');
        }
      }
      const languages = new Set(config.visibleLanguages);
      const select = document.querySelector('#languageSelect');
      if (select) {
        for (const option of select.querySelectorAll('option[value]')) {
          if (!option.value) continue;
          option.hidden = !languages.has(option.value);
        }
        if (select.selectedOptions[0]?.hidden) {
          select.value = 'javascript';
          select.dispatchEvent(new Event('change'));
        }
      }
      const notice = config.announcement;
      if (notice?.enabled && notice.text) {
        const bar = document.createElement(notice.link ? 'a' : 'div');
        bar.className = 'site-announcement';
        bar.textContent = notice.text;
        if (notice.link) {
          bar.href = notice.link;
          if (/^https:\/\//i.test(notice.link)) {bar.target='_blank';bar.rel='noopener noreferrer'}
          if (notice.linkLabel) {const label=document.createElement('b');label.textContent=` ${notice.linkLabel} ↗`;bar.append(label)}
        }
        document.querySelector('.topbar')?.after(bar);
      }
    })
    .catch(() => {});
})();
