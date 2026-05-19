let styles = `
<style>
:host {
    --border-color: #ccc;
    --background-color: #eee;
    --text-color: #111;
    --link-color: #369;
}
@media (prefers-color-scheme: dark) {    
    :host {
        --border-color: #111;
        --background-color: #333;
        --text-color: #ccc;
        --link-color: #69c;
    }
}
div {
    font-family: sans-serif;
    border: 1px solid var(--border-color);
    line-height: 1.3em;
    padding: 1em;
    color:var(--text-color);
    margin: 1em 0;
    border-radius: 0.5em;
    background-color: var(--background-color);
}
p {
    font-size: 1em;
}
    a {
    text-decoration: none;
    color: var(--link-color);
}
a:hover, a:focus {
    text-decoration: underline;
}
.github-include-pages {
  padding: 0 .5em;
  display:inline-block;
}
div > a:nth-of-type(1) {
  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'><path d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.238 1.84 1.238 1.07 1.835 2.807 1.305 3.492.998.108-.776.42-1.305.762-1.606-2.665-.305-5.466-1.334-5.466-5.93 0-1.31.467-2.381 1.235-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.119 3.176.77.84 1.233 1.911 1.233 3.221 0 4.61-2.807 5.62-5.48 5.92.431.372.815 1.102.815 2.222 0 1.606-.014 2.9-.014 3.293 0 .32.216.694.825.576C20.565 22.092 24 17.592 24 12.297 24 5.67 18.627.297 12 .297z'/></svg>");
  background-repeat: no-repeat;
  background-position: left center;
  background-size: 1.6em;
  padding-left: 2.4em;
  display: inline-flex;
  align-items: center;
  min-height: 2em;
}
</style>`;

let proxy = 'https://api.allorigins.win/raw?url=';
let suffix = '/commits/main.atom';
let user = '';
let repo = '';

const getsettings = (setting, source) => {
    if(source.nodeName === 'GITHUB-INCLUDE') {
        return source.getAttribute(setting);
    } else {
        return source.dataset[setting];
    }
};

const createpages = (from,container,user,repo) => {
    let pageslink = document.createElement('a');
    pageslink.classList.add('github-include-pages');
    pageslink.href = `https://${user}.github.io/${repo}/`;
    pageslink.target = '_blank';
    pageslink.rel = 'noopener';
    pageslink.title = `View GitHub Pages for ${repo}`;
    pageslink.innerHTML = getsettings('pages', from) === '' ? 'Demo' : getsettings('pages', from);
    container.appendChild(pageslink);
};

// eslint-disable-next-line no-unused-vars
const getcommits = (from,container,user,repo) => {
    let links =  getsettings('links', from);
    links = links === 'true' ? true : false;
    let commitheader = getsettings('commitheader', from) || 'Latest commits: ';
    let loadingmessage = getsettings('loadingmessage', from) || 'loading…';
    let p = document.createElement('p');
    p.className = 'github-include-commitheader';
    p.innerText = commitheader;
    container.appendChild(p);
    let origin = container.querySelector('a').href;
    let url = `${proxy}${encodeURIComponent(origin+suffix)}`;
    let list = document.createElement('ul');
    list.className = 'github-include-commits';
    container.appendChild(list);
    list.innerHTML = loadingmessage;
    fetch(url, {'method': 'GET'})
        .then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, 'text/xml'))
        .then(data => {
            let items = data.querySelectorAll('entry');
            let out = '';
            if (getsettings('commits', from) !== '-1') {
                items = Array.from(items).slice(0, +getsettings('commits', from));
            }
            items.forEach(el => {
                let title = el.querySelector('title').innerHTML;
                let link = el.querySelector('link').getAttribute('href');
                out += `<li>
                    ${links ? `<a href="${link}">` : ''}
                    ${title.trim()}
                    ${links  ? '</a>' : ''}
                </li>`;
            });
            list.innerHTML = out;
        });

};

// Web Component
class gitHubInclude extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `${styles}<div></div>`;
  }

  connectedCallback() {
    const init = () => {
      const anchor = this.querySelector('a');
      if (!anchor) {
        // Angular may attach children slightly later — retry a tick
        return setTimeout(init, 0);
      }

      // move light-dom content into shadow container
      let old = this.innerHTML;
      let container = this.shadowRoot.querySelector('div');

      // parse user/repo from the anchor href (robust against trailing slashes)
      const href = anchor.getAttribute('href') || '';
      const chunks = href.split('/').filter(Boolean);
      repo = chunks.pop() || '';
      user = chunks.pop() || '';

      container.innerHTML += old;

      if (getsettings('pages', this) !== null) {
        createpages(this, container, user, repo);
      }
      if (getsettings('commits', this)) {
        getcommits(this, container, user, repo);
      }
    };

    init();
  }
}
customElements.define('github-include', gitHubInclude);