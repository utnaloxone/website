import { getMetadata, loadBlock } from '../scripts/nexter.js';

(async function loadFooter() {
  const footer = document.querySelector('footer');
  if (!footer) return;
  const meta = getMetadata('footer') || 'footer';
  if (meta === 'off') {
    footer.remove();
    return;
  }
  footer.className = meta;
  loadBlock(footer);
}());
