// اجرای پایتون واقعی (CPython → WebAssembly) در پس‌زمینه تا صفحه هنگ نکند
importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');

let py, buf = [], lines = [];
const ready = (async () => {
  py = await loadPyodide();
  py.setStdout({ batched: s => buf.push(s) });
  py.setStderr({ batched: s => buf.push(s) });
  py.setStdin({ stdin: () => (lines.length ? lines.shift() : undefined) });
  await py.loadPackage('micropip');
  postMessage({ type: 'ready' });
})();

const RUN = `G={'__name__':'__main__'}
exec(compile(USER,'main.py','exec'),G)
None`;

const TEST = `import json
G={'__name__':'__main__'}
exec(compile(USER,'main.py','exec'),G)
R=[]
for t in json.loads(TESTS):
    info=''
    try:
        ok=bool(eval(t,G))
        if not ok and '==' in t:
            info=repr(eval(t.rsplit('==',1)[0],G))
    except Exception as e:
        ok=False; info=type(e).__name__+': '+str(e)
    R.append([t,ok,info])
json.dumps(R)`;

onmessage = async ({ data: d }) => {
  await ready;
  lines = d.stdin ? d.stdin.split('\n') : [];
  py.globals.set('USER', d.code);
  py.globals.set('TESTS', JSON.stringify(d.tests || []));
  let err = '', results = null;
  for (let i = 0; i < 6; i++) {
    buf = []; err = '';
    try {
      postMessage({ type: 'status', text: 'بررسی کتابخانه‌ها…' });
      await py.loadPackagesFromImports(d.code);
      postMessage({ type: 'status', text: 'در حال اجرا…' });
      const r = await py.runPythonAsync(d.mode === 'test' ? TEST : RUN);
      if (d.mode === 'test') results = JSON.parse(r);
      break;
    } catch (e) {
      const L = String(e.message).trim().split('\n');
      const k = L.findIndex(l => l.includes('File "main.py"'));
      err = (k >= 0 ? ['Traceback (most recent call last):', ...L.slice(k)] : L.slice(-2)).join('\n');
      const m = /No module named '([\w.]+)'/.exec(e.message);
      if (!m) break;
      try {
        postMessage({ type: 'status', text: 'نصب ' + m[1].split('.')[0] + '…' });
        await py.runPythonAsync(`import micropip\nawait micropip.install('${m[1].split('.')[0]}')`);
      } catch (_) { err += '\n(نصب خودکار ماژول ممکن نشد)'; break; }
    }
  }
  postMessage({ type: 'done', out: buf.join('\n'), err, results });
};
