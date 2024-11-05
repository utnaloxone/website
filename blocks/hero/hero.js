export default async function init(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  const fg = rows.pop();
  fg.classList.add('hero-foreground');
  if (rows.length) {
    const bg = rows.pop();
    bg.classList.add('hero-background');
  }
}
