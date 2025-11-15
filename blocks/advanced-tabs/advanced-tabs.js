import { getConfig } from '../../scripts/ak.js';

const { log } = getConfig();

function getTabList(tabItems, tabPanels) {
  const tabList = document.createElement('div');
  tabList.className = 'tab-list';
  tabList.role = 'tablist';

  for (const [idx, tab] of tabItems.entries()) {
    const btn = document.createElement('button');
    btn.role = 'tab';
    btn.id = `tab-${idx + 1}`;
    btn.textContent = tab.textContent;
    if (idx === 0) btn.classList.add('is-active');
    tabList.append(btn);

    btn.addEventListener('click', () => {
      // Remove all active styles
      tabList.querySelectorAll('button')
        .forEach((button) => { button.classList.remove('is-active'); });

      tabPanels.forEach((sec) => { sec.classList.remove('is-visible'); });
      tabPanels[idx].classList.add('is-visible');
      btn.classList.add('is-active');
    });
  }

  return tabList;
}

export default function init(el) {
  // Find the top most parent where all tab sections live
  const parent = el.closest('.fragment-content, main');

  // Find the section that contains the actual block
  const currSection = el.closest('.section');

  // Find the tab items
  const tabItems = el.querySelectorAll('li');
  if (!tabItems.length) {
    log('Please add an unordered list to the advanced tabs block.');
    return;
  }

  // Filter and format all sections that do not hold the tabs block
  const tabPanels = [...parent.querySelectorAll(':scope > .section')]
    .reduce((acc, section, idx) => {
      if (section !== currSection) {
        section.id = `tabpanel-${idx + 1}`;
        section.role = 'tabpanel';
        section.setAttribute('aria-labelledby', `tab-${idx + 1}`);
        acc.push(section);
      }
      return acc;
    }, []);

  tabPanels[0].classList.add('is-visible');

  // Clear out all children
  el.replaceChildren();

  const tabList = getTabList(tabItems, tabPanels);

  el.append(tabList, ...tabPanels);
}
