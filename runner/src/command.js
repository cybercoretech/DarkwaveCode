export function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

export function commandWithStdin(argv) {
  if (!Array.isArray(argv) || argv.length === 0 || argv.some(value => typeof value !== 'string')) {
    throw new TypeError('Expected a non-empty argv array of strings.');
  }
  return ['/bin/bash', '-lc', `${argv.map(shellQuote).join(' ')} < /workspace/stdin.txt`];
}
