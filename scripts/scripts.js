import { setConfig, loadArea } from './nx.js';

function decorateArea(area = document) {
  const eagerLoad = (parent, selector) => {
    const img = parent.querySelector(selector);
    img?.removeAttribute('loading');
  };

  (async function loadLCPImage() {
    const hero = area.querySelector('.nx-hero');
    if (!hero) {
      eagerLoad(area, 'img');
      return;
    }

    eagerLoad(hero, 'div:first-child img');
    eagerLoad(hero, 'div:last-child > div:last-child img');
  }());
}

const CONFIG = { decorateArea };

decorateArea();
setConfig(CONFIG);
loadArea();
