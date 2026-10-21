(() => {
  const examples = {
    values: {
      label: '01 / VALUES',
      title: 'Typed signals',
      body: 'Give a value an explicit type, compose an expression, and inspect the interpreter’s final value.',
      code: 'let signal: i32 = 2;\nlet response = signal * 21;\nresponse;',
      result: 'Int(42)'
    },
    flow: {
      label: '02 / CONTROL FLOW',
      title: 'Count a signal loop',
      body: 'Use a mutable binding and a while loop to update state until its condition becomes false.',
      code: 'let ticks: i32 = 0;\nwhile ticks < 3 { ticks = ticks + 1; }\nticks;',
      result: 'Int(3)'
    },
    records: {
      label: '03 / STRUCTURED DATA',
      title: 'Read a record',
      body: 'Declare a record shape, construct a typed value, and access its fields in an expression.',
      code: 'record Node { id: i32, load: i32 }\nlet node: Node = Node { id: 7, load: 3 };\nnode.id + node.load;',
      result: 'Int(10)'
    }
  };
  const buttons = [...document.querySelectorAll('[data-vex-example]')];
  const setExample = key => {
    const example = examples[key];
    if (!example) return;
    document.querySelector('#vexExampleLabel').textContent = example.label;
    document.querySelector('#vexExampleTitle').textContent = example.title;
    document.querySelector('#vexExampleBody').textContent = example.body;
    document.querySelector('#vexExampleCode').textContent = example.code;
    document.querySelector('#vexExampleResult').textContent = example.result;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.vexExample === key)));
    document.querySelector('#loadVexSample').dataset.example = key;
  };
  buttons.forEach(button => button.addEventListener('click', () => setExample(button.dataset.vexExample)));
  document.querySelector('#loadVexSample').addEventListener('click', event => {
    const example = examples[event.currentTarget.dataset.example];
    if (!example) return;
    try {
      sessionStorage.setItem('darkwavecode-course-mission', JSON.stringify({
        track: 'vex',
        title: example.title,
        language: 'vex',
        code: example.code
      }));
      location.href = 'workbench.html?from=vexlab';
    } catch {
      event.currentTarget.textContent = 'BROWSER STORAGE UNAVAILABLE';
    }
  });
  setExample('values');
})();
