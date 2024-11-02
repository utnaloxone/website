import { getConfig, getMetadata } from '../scripts/nexter.js';

(async function loadFavicon() {
  const { codeBase } = getConfig();
  const name = getMetadata('favicon') || 'favicon';
  const favBase = `${codeBase}/img/favicons/${name}`;

  const tags = `<link rel="apple-touch-icon" href="${favBase}-180.png">
                <link rel="manifest" href="${favBase}.webmanifest">`;

  const favicon = document.head.querySelector('link[rel="icon"]');
  favicon.insertAdjacentHTML('afterend', tags);
  favicon.href = `${favBase}.ico`;
}());
