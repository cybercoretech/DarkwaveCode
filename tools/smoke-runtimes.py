#!/usr/bin/env python3
"""Compile or run harmless Hello World samples for runtimes installed locally."""
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

SOURCE = "hello darkwave"


def main():
    passed, skipped, failed = [], [], []
    with tempfile.TemporaryDirectory(prefix="darkwave-smoke-", dir="/tmp") as temp:
        root = Path(temp)

        def run(name, argv, expected=SOURCE, env=None):
            if not shutil.which(argv[0]):
                skipped.append(name)
                print(f"SKIP {name} (missing {argv[0]})")
                return False
            result = subprocess.run(
                argv,
                capture_output=True,
                text=True,
                timeout=45,
                env={**os.environ, **(env or {})},
            )
            if result.returncode or expected not in result.stdout:
                failed.append((name, result.returncode, result.stdout, result.stderr))
                print(f"FAIL {name}: exit {result.returncode}")
                return False
            passed.append(name)
            print(f"PASS {name}")
            return True

        compiled = [
            ("C", "hello.c", '#include <stdio.h>\nint main(void){puts("hello darkwave");return 0;}\n', "gcc"),
            ("C++", "hello.cpp", '#include <iostream>\nint main(){std::cout << "hello darkwave\\n";}\n', "g++"),
            ("Rust", "hello.rs", 'fn main(){println!("hello darkwave");}\n', "rustc"),
        ]
        for label, filename, code, compiler in compiled:
            source = root / filename
            executable = root / (source.stem + "-run")
            source.write_text(code)
            if shutil.which(compiler):
                result = subprocess.run(
                    [compiler, str(source), "-o", str(executable)],
                    capture_output=True,
                    text=True,
                    timeout=60,
                )
                if result.returncode:
                    failed.append((label + " compile", result.returncode, result.stdout, result.stderr))
                    print(f"FAIL {label} compile: {result.stderr.strip()}")
                else:
                    run(label, [str(executable)])
            else:
                skipped.append(label)
                print(f"SKIP {label} (missing {compiler})")

        run("JavaScript", ["node", "-e", f'console.log("{SOURCE}")'])
        run("Python", ["python3", "-c", f'print("{SOURCE}")'])

        ts_source = root / "hello.ts"
        ts_source.write_text('const message: string = "hello darkwave"; console.log(message);\n')
        if shutil.which("tsc") and shutil.which("node"):
            result = subprocess.run(
                ["tsc", str(ts_source), "--target", "ES2022", "--module", "commonjs", "--outDir", str(root / "ts-out")],
                capture_output=True,
                text=True,
                timeout=45,
            )
            if result.returncode:
                failed.append(("TypeScript compile", result.returncode, result.stdout, result.stderr))
                print(f"FAIL TypeScript compile: {result.stderr.strip()}")
            else:
                run("TypeScript", ["node", str(root / "ts-out" / "hello.js")])
        else:
            skipped.append("TypeScript")
            print("SKIP TypeScript (missing tsc or node)")

        go_file = root / "hello.go"
        go_file.write_text('package main\nimport "fmt"\nfunc main(){fmt.Println("hello darkwave")}\n')
        run("Go", ["go", "run", str(go_file)], env={"GOCACHE": str(root / "go-cache")})

        java_file = root / "Hello.java"
        java_file.write_text('class Hello { public static void main(String[] args) { System.out.println("hello darkwave"); } }')
        run("Java", ["java", str(java_file)])
        run("Bash", ["bash", "-lc", 'printf "hello darkwave\\n"'])
        run("SQLite SQL", ["sqlite3", ":memory:", "select 'hello darkwave';"])
        run("Perl", ["perl", "-e", 'print "hello darkwave\\n"'])
        run("Erlang", ["erl", "-noshell", "-eval", 'io:format("hello darkwave~n"), halt().'])
        run("Lua", ["lua", "-e", 'print("hello darkwave")'])
        run("Ruby", ["ruby", "-e", 'puts "hello darkwave"'])

    print(f"\n{len(passed)} passed · {len(skipped)} skipped · {len(failed)} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
