(() => {
  const PREFIX = 'lllu:v1:';

  // localStorage can be blocked in some browser modes.
  let storage;
  try {
    storage = window.localStorage;
    const t = '__lllu_test__';
    storage.setItem(t, '1');
    storage.removeItem(t);
  } catch {
    return;
  }

  const page = (location.pathname.split('/').pop() || 'index.html')
    .replace(/[^a-z0-9_.-]/gi, '_');
  const keyBase = `${PREFIX}${page}:`;

  const fields = Array.from(document.querySelectorAll('input, textarea, select'))
    .filter((el) => {
      if (el.hasAttribute('data-nosave')) return false;
      const type = (el.getAttribute('type') || '').toLowerCase();
      if (type === 'file' || type === 'password') return false;
      if (type === 'button' || type === 'submit' || type === 'reset') return false;
      return true;
    });

  const getFieldKey = (el) => {
    const type = (el.getAttribute('type') || '').toLowerCase();

    if (type === 'radio' || type === 'checkbox') {
      const name = el.name || el.id;
      if (!name) return null;
      return `${keyBase}name:${name}`;
    }

    const id = el.id || el.name;
    if (!id) return null;
    return `${keyBase}${id}`;
  };

  const restore = (el, key) => {
    const type = (el.getAttribute('type') || '').toLowerCase();
    const stored = storage.getItem(key);
    if (stored == null) return;

    if (type === 'radio') {
      if (el.value === stored) el.checked = true;
      return;
    }

    if (type === 'checkbox') {
      el.checked = stored === '1';
      return;
    }

    el.value = stored;
  };

  const persist = (el, key) => {
    const type = (el.getAttribute('type') || '').toLowerCase();

    if (type === 'radio') {
      if (el.checked) storage.setItem(key, el.value);
      return;
    }

    if (type === 'checkbox') {
      storage.setItem(key, el.checked ? '1' : '0');
      return;
    }

    storage.setItem(key, String(el.value ?? ''));
  };

  for (const el of fields) {
    const key = getFieldKey(el);
    if (!key) continue;

    restore(el, key);

    const type = (el.getAttribute('type') || '').toLowerCase();
    const eventName =
      type === 'radio' || type === 'checkbox' || el.tagName === 'SELECT'
        ? 'change'
        : 'input';

    el.addEventListener(eventName, () => {
      try {
        persist(el, key);
      } catch {
        // ignore
      }
    });
  }

  for (const btn of Array.from(document.querySelectorAll('[data-action="clear"]'))) {
    btn.addEventListener('click', () => {
      try {
        const toRemove = [];
        for (let i = 0; i < storage.length; i++) {
          const k = storage.key(i);
          if (k && k.startsWith(keyBase)) toRemove.push(k);
        }
        for (const k of toRemove) storage.removeItem(k);
      } catch {
        // ignore
      }
      location.reload();
    });
  }
})();
