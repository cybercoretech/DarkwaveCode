(() => {
  const tracks = window.darkwaveCourses || {};
  const params = new URLSearchParams(location.search);
  const trackKey = params.get('track');
  const track = tracks[trackKey];
  if (!track) {
    document.querySelector('#courseTitle').innerHTML = 'TRACK <span>NOT FOUND</span>';
    document.querySelector('#courseIntro').textContent = 'Choose one of the five foundation tracks to begin.';
    document.querySelector('.course-layout').innerHTML = '<div class="lesson-panel"><a class="button primary" href="index.html#tracks">BROWSE TRACKS ↗</a></div>';
    return;
  }

  const title = document.querySelector('#courseTitle');
  title.textContent = '';
  const titleText = track.title.split(' ');
  title.append(document.createTextNode(titleText.slice(0, -1).join(' ') + (titleText.length > 1 ? ' ' : '')));
  const accent = document.createElement('span');
  accent.textContent = titleText.at(-1);
  title.append(accent);
  document.title = `${track.title} Foundation — DarkwaveCode`;
  document.querySelector('#courseIntro').textContent = track.intro;

  const storageKey = `darkwave-course-${trackKey}`;
  const loadProgress = () => { try { const data = JSON.parse(localStorage.getItem(storageKey) || '{}'); return Array.isArray(data) ? data : [] } catch { return [] } };
  let completed = loadProgress().filter(index => Number.isInteger(index) && index >= 0 && index < track.lessons.length);
  let current = 0;
  const list = document.querySelector('#lessonList');
  const buttons = track.lessons.map((lesson, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lesson-link';
    button.innerHTML = `<b>0${index + 1}</b><span></span><i></i>`;
    button.children[1].textContent = lesson.title;
    button.addEventListener('click', () => { current = index; render() });
    list.append(button);
    return button;
  });
  const render = () => {
    const lesson = track.lessons[current];
    document.querySelector('#lessonEyebrow').textContent = `MODULE 0${current + 1} / ${track.title}`;
    document.querySelector('#lessonTitle').textContent = lesson.title;
    document.querySelector('#lessonBody').textContent = lesson.body;
    document.querySelector('#lessonExample').textContent = lesson.example;
    document.querySelector('#lessonChallenge').textContent = lesson.challenge;
    document.querySelector('#lessonTip').textContent = lesson.tip;
    buttons.forEach((button, index) => {
      button.classList.toggle('active', index === current);
      button.setAttribute('aria-current', index === current ? 'step' : 'false');
      button.children[2].textContent = completed.includes(index) ? '✓' : '';
    });
    document.querySelector('#progressLabel').textContent = `${completed.length} / ${track.lessons.length} LESSONS`;
    document.querySelector('#progressFill').style.width = `${completed.length / track.lessons.length * 100}%`;
    const previous = document.querySelector('#previousLesson');
    const next = document.querySelector('#nextLesson');
    previous.disabled = current === 0;
    next.disabled = current === track.lessons.length - 1;
    const complete = document.querySelector('#completeLesson');
    complete.textContent = completed.includes(current) ? 'COMPLETED ✓' : 'MARK COMPLETE ✓';
  };
  document.querySelector('#previousLesson').addEventListener('click', () => { if (current > 0) { current--; render() } });
  document.querySelector('#nextLesson').addEventListener('click', () => { if (current < track.lessons.length - 1) { current++; render() } });
  document.querySelector('#completeLesson').addEventListener('click', () => {
    if (!completed.includes(current)) completed.push(current);
    completed.sort((a, b) => a - b);
    try { localStorage.setItem(storageKey, JSON.stringify(completed)); } catch { document.querySelector('#lessonTip').textContent += ' Progress could not be saved in this browser.' }
    if (current < track.lessons.length - 1) current++;
    render();
  });
  render();
})();
