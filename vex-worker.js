let runtimePromise;

self.onmessage = async event => {
  try {
    runtimePromise ||= import('./vex-runtime/vexlang.js').then(async module => {
      await module.default();
      return module.run_vex;
    });
    const runVex = await runtimePromise;
    const result = JSON.parse(runVex(String(event.data?.source || '')));
    self.postMessage({type:'result', result});
  } catch (error) {
    self.postMessage({type:'failed', error:error?.message || String(error)});
  }
};
