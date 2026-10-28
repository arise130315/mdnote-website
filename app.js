const header = document.querySelector('.header');
let headerCollapsed = false;
const updateHeader = () => {
  if (!headerCollapsed && window.scrollY > 72) headerCollapsed = true;
  else if (headerCollapsed && window.scrollY < 24) headerCollapsed = false;
  header?.classList.toggle('scrolled', headerCollapsed);
};
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

const menu = document.querySelector('.menu-button');
const nav = document.querySelector('.nav-links');
function closeMenu(restoreFocus = false) {
  nav?.classList.remove('is-open');
  menu?.setAttribute('aria-expanded', 'false');
  menu?.setAttribute('aria-label', '打开导航');
  if (restoreFocus) menu?.focus();
}
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
  nav.classList.toggle('is-open', open);
});
nav?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') closeMenu(true); });
document.addEventListener('click', event => { if (!event.target.closest('.nav')) closeMenu(); });
window.matchMedia('(min-width: 781px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
// Preserve the reference's natural-scroll filmstrip without intercepting wheel input.
const storyPin = document.getElementById('story-pin');
if (storyPin) {
  const desktop = window.matchMedia('(min-width: 781px)');
  const strip = storyPin.querySelector('.story-strip');
  const stage = storyPin.querySelector('.story-stage');
  const tabs = [...storyPin.querySelectorAll('.story-tab')];
  const panels = [...storyPin.querySelectorAll('.story-panel')];
  let scheduled = false;

  function setActive(index, pinned) {
    tabs.forEach((button, i) => {
      button.classList.toggle('is-active', i === index);
      button.setAttribute('aria-pressed', String(i === index));
    });
    panels.forEach((panel, i) => {
      panel.classList.toggle('is-current', i === index);
      panel.inert = pinned && i !== index;
    });
  }

  function updateStory() {
    scheduled = false;
    const pinned = desktop.matches && !motion.matches;
    if (!pinned) {
      strip.style.transform = '';
      panels.forEach(panel => { panel.style.transform = ''; panel.style.opacity = ''; panel.inert = false; });
      document.documentElement.style.removeProperty('--story-tail-gap');
      return;
    }
    const total = storyPin.offsetHeight - window.innerHeight;
    const passed = Math.min(Math.max(-storyPin.getBoundingClientRect().top, 0), total);
    const position = total > 0 ? (passed / total) * (panels.length - 1) : 0;
    const step = Math.min(panels.length - 2, Math.floor(position));
    const fraction = Math.min(1, Math.max(0, position - step));
    const cursor = step + .5 - .5 * Math.cos(Math.PI * fraction);
    const cardHeight = panels[0].offsetHeight;
    const gap = parseFloat(getComputedStyle(strip).rowGap) || 32;
    strip.style.transform = `translate3d(0, ${-cursor * (cardHeight + gap)}px, 0)`;
    panels.forEach((panel, i) => {
      const distance = Math.min(1, Math.abs(i - cursor));
      panel.style.transform = `scale(${1 - .1 * distance})`;
      panel.style.opacity = String(1 - .6 * distance);
    });
    setActive(Math.round(cursor), true);
    const tail = window.innerHeight - parseFloat(getComputedStyle(stage).paddingTop) - cardHeight;
    document.documentElement.style.setProperty('--story-tail-gap', `${-Math.max(0, tail) * .4}px`);
  }

  function scheduleStory() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateStory); }
  }
  window.addEventListener('scroll', scheduleStory, { passive: true });
  window.addEventListener('resize', scheduleStory);
  desktop.addEventListener('change', scheduleStory);
  motion.addEventListener('change', scheduleStory);
  tabs.forEach((button, index) => button.addEventListener('click', () => {
    if (!desktop.matches || motion.matches) {
      setActive(index, false);
      panels[index].scrollIntoView({ block: 'center', behavior: motion.matches ? 'instant' : 'smooth' });
      return;
    }
    const top = storyPin.getBoundingClientRect().top + window.scrollY;
    const total = storyPin.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + total * index / (panels.length - 1), behavior: 'smooth' });
  }));
  updateStory();
}

const organization = document.querySelector('.organization');
if (organization) {
  const diagram = document.getElementById('note-view-diagram');
  const notes = [...diagram.querySelectorAll('.view-note')];
  const layouts = {
    project: { positions: [[58,48],[58,104],[58,160],[266,48],[266,104],[266,160]], label: '同一组六篇笔记，按工作和生活两个项目归类' },
    source: { positions: [[24,58],[162,58],[300,58],[162,134],[24,134],[300,134]], label: '同一组六篇笔记，按文稿、Obsidian 和 AI 工具三个来源归类' },
    type: { positions: [[150,14],[150,92],[150,170],[278,170],[278,14],[278,92]], label: '同一组六篇笔记，按笔记、计划和清单三种类型归类' },
  };
  organization.querySelectorAll('[data-note-view]').forEach(button => button.addEventListener('click', () => {
    const view = button.dataset.noteView;
    organization.querySelectorAll('[data-note-view]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    diagram.querySelectorAll('[data-groups]').forEach(group => group.toggleAttribute('hidden', group.dataset.groups !== view));
    notes.forEach((note, index) => { const [x, y] = layouts[view].positions[index]; note.style.transform = `translate(${x}px,${y}px)`; });
    diagram.setAttribute('aria-label', layouts[view].label);
  }));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { organization.classList.add('is-visible'); observer.disconnect(); }
    }, { threshold: .25 });
    observer.observe(organization);
  }
}

document.querySelector('.print-button')?.addEventListener('click', () => window.print());
if ('IntersectionObserver' in window && document.querySelector('.legal-toc')) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      document.querySelectorAll('.legal-toc a').forEach(link => {
        const active = link.hash === `#${entry.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
  }, { rootMargin: '-100px 0px -65% 0px', threshold: 0 });
  document.querySelectorAll('.legal-content section').forEach(section => observer.observe(section));
}
