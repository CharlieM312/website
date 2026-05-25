let styles = `
<style>
:host {
    --border-color: #ccc;
    --background-color: #eee;
    --text-color: #111;
    --link-color: #369;
} 
:host-context(body.dark-mode) {
    --border-color: #111;
    --background-color: #333;
    --text-color: #ccc;
    --link-color: #69c;
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
.workflow-success { color: #2e7d32; margin-right: .5em; }
.workflow-failure { color: #c62828; margin-right: .5em; }
.workflow-in-progress { color: #f9a825; margin-right: .5em; }
.workflow-neutral { color: #666; margin-right: .5em; }
.workflow-label { color: inherit; }
</style>`;

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
    pageslink.rel = 'noopener noreferrer';
    pageslink.title = `View GitHub Pages for ${repo}`;
    pageslink.innerHTML = getsettings('pages', from) === '' ? 'Demo' : getsettings('pages', from);
    container.appendChild(pageslink);
};

const getcommits = async (from, container, user, repo) => {
  const links = getsettings('links', from) === 'true';
  const commitheader = getsettings('commitheader', from) || 'Latest commits: ';
  const loadingmessage = getsettings('loadingmessage', from) || 'loading…';
  const commitCount = getsettings('commits', from) || '5';

  const p = document.createElement('p');
  p.className = 'github-include-commitheader';
  p.innerText = commitheader;
  container.appendChild(p);

  const list = document.createElement('ul');
  list.className = 'github-include-commits';
  list.innerHTML = `<li>${loadingmessage}</li>`;
  container.appendChild(list);

  const url = `https://api.github.com/repos/${user}/${repo}/commits?per_page=${commitCount}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2026-03-10'
    }
  });

  if (!response.ok) {
    list.innerHTML = '<li>Failed to load commits</li>';
    return;
  }

  const commits = await response.json();

  list.textContent = '';

  commits.forEach(commit => {
    const title = commit.commit.message.split('\n')[0];
    const link = commit.html_url;

    const li = document.createElement('li');

    if (links) {
      const a = document.createElement('a');
      a.href = link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      appendCommitTitle(a, title, user, repo);
      li.appendChild(a);
    } else {
      appendCommitTitle(li, title, user, repo);
    }

    list.appendChild(li);
  });
};

const appendnpmPackageLink = (li, packageName) => {
  const npmLink = document.createElement('a');
  npmLink.href = `https://www.npmjs.com/package/${packageName}`;
  npmLink.target = '_blank';
  npmLink.rel = 'noopener noreferrer';
  npmLink.textContent = packageName;
  li.appendChild(npmLink);
};

const appendCommitTitle = (container, title, user, repo) => {
  const bumpMatch = title.match(
    /^Bump\s+(@?[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9][a-z0-9._-]*)?)\s+from\s+\S+\s+to\s+\S+\s+in\s+.+?(?:\s+\(#\d+\))?$/i
  );

  if (bumpMatch) {
    const packageName = bumpMatch[1];
    container.appendChild(document.createTextNode('Bump '));
    appendnpmPackageLink(container, packageName);

    const rest = title.slice(`Bump ${packageName}`.length).trimStart();
    if (rest) {
      container.appendChild(document.createTextNode(' '));
      appendLinkedCommitTitle(container, rest, user, repo);
    }

    return;
  }

  appendLinkedCommitTitle(container, title, user, repo);
};

const appendLinkedCommitTitle = (li, title, user, repo) => {
  const prPattern = /\(#(\d+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = prPattern.exec(title)) !== null) {
    if (match.index > lastIndex) {
      li.appendChild(document.createTextNode(title.slice(lastIndex, match.index)));
    }

    const prNumber = match[1];
    const prLink = document.createElement('a');
    prLink.href = `https://github.com/${user}/${repo}/pull/${prNumber}`;
    prLink.target = '_blank';
    prLink.rel = 'noopener noreferrer';
    prLink.textContent = `(#${prNumber})`;
    li.appendChild(prLink);

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < title.length) {
    li.appendChild(document.createTextNode(title.slice(lastIndex)));
  }
};

const getworkflows = async (from, container, user, repo) => {
  const loadingmessage = getsettings('loadingmessage', from) || 'loading…';
  const workflowCount = getsettings('workflows', from) || '5';

  const p = document.createElement('p');
  p.className = 'github-include-workflowheader';
  p.innerText = 'Latest workflows:';
  container.appendChild(p);

  const list = document.createElement('ul');
  list.className = 'github-include-workflows';
  list.innerHTML = `<li>${loadingmessage}</li>`;
  container.appendChild(list);

  const url = `https://api.github.com/repos/${user}/${repo}/actions/runs?per_page=${workflowCount}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2026-03-10'
    }
  });

  if (!response.ok) {
    list.innerHTML = '<li>Failed to load workflows</li>';
    return;
  }

  const data = await response.json();

  list.textContent = '';

    // helper to pick an icon and class
    const getStatus = run => {
    if (run.conclusion === 'success') return {icon: '✅', cls: 'workflow-success'};
    if (run.conclusion === 'failure') return {icon: '❌', cls: 'workflow-failure'};
    if (run.conclusion === 'cancelled') return {icon: '⚪', cls: 'workflow-cancelled'};
    if (run.status === 'in_progress') return {icon: '🟡', cls: 'workflow-in-progress'};
    return {icon: '⚫', cls: 'workflow-neutral'};
    };

    data.workflow_runs.forEach(run => {
    const { icon, cls } = getStatus(run);
    const statusText = run.conclusion || run.status;

    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = run.html_url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    const iconSpan = document.createElement('span');
    iconSpan.className = cls;
    iconSpan.textContent = icon; // safe

    const labelSpan = document.createElement('span');
    labelSpan.className = 'workflow-label';
    // Use textContent so run.name cannot inject HTML
    labelSpan.textContent = ` ${run.name} — ${statusText}`;

    a.appendChild(iconSpan);
    a.appendChild(labelSpan);
    li.appendChild(a);
    list.appendChild(li);
    });
};

// Web Component
class GitHubInclude extends HTMLElement {
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
      if (getsettings('workflows', this)) {
        getworkflows(this, container, user, repo);
      }
    };

    init();
  }
}
customElements.define('github-include', GitHubInclude);