export const RUNTIMES = {
  javascript: { label: 'JavaScript (Node.js)', file: 'main.js', run: ['node', '/workspace/main.js'] },
  typescript: { label: 'TypeScript', file: 'main.ts', compile: ['tsc', '/workspace/main.ts', '--target', 'ES2022', '--module', 'commonjs', '--outDir', '/workspace/build'], run: ['node', '/workspace/build/main.js'] },
  python: { label: 'Python 3', file: 'main.py', run: ['python3', '/workspace/main.py'] },
  c: { label: 'C', file: 'main.c', compile: ['gcc', '-std=c17', '-O0', '/workspace/main.c', '-o', '/workspace/main-bin'], run: ['/workspace/main-bin'] },
  cpp: { label: 'C++', file: 'main.cpp', compile: ['g++', '-std=c++20', '-O0', '/workspace/main.cpp', '-o', '/workspace/main-bin'], run: ['/workspace/main-bin'] },
  rust: { label: 'Rust', file: 'main.rs', compile: ['rustc', '/workspace/main.rs', '-o', '/workspace/main-bin'], run: ['/workspace/main-bin'] },
  go: { label: 'Go', file: 'main.go', run: ['go', 'run', '/workspace/main.go'], env: { GOPROXY: 'off', GOTOOLCHAIN: 'local' } },
  java: { label: 'Java', file: 'Main.java', compile: ['javac', '-d', '/workspace/build', '/workspace/Main.java'], run: ['java', '-cp', '/workspace/build', 'Main'] },
  bash: { label: 'Bash / Shell', file: 'main.sh', run: ['bash', '/workspace/main.sh'] },
  sql: { label: 'SQL (SQLite)', file: 'main.sql', run: ['python3', '/usr/local/bin/darkwave-sqlite.py', '/workspace/main.sql'] },
  perl: { label: 'Perl', file: 'main.pl', run: ['perl', '/workspace/main.pl'] },
  erlang: { label: 'Erlang', file: 'main.erl', compile: ['erlc', '-o', '/workspace/build', '/workspace/main.erl'], run: ['erl', '-noshell', '-pa', '/workspace/build', '-s', 'main', 'main', '-s', 'init', 'stop'] },
  lua: { label: 'Lua', file: 'main.lua', run: ['lua', '/workspace/main.lua'] },
  ruby: { label: 'Ruby', file: 'main.rb', run: ['ruby', '/workspace/main.rb'] },
};

export const LANGUAGE_IDS = Object.keys(RUNTIMES);
