(() => {
const starter='#include <stdio.h>\n\nint main(void) {\n    printf("Hello, DarkwaveCode\\n");\n    return 0;\n}';
const templates={
 c:'#include <stdio.h>\n\nint main(void) {\n    printf("Hello, DarkwaveCode\\n");\n    return 0;\n}',
 cpp:'#include <iostream>\n\nint main() {\n    std::cout << "Hello, DarkwaveCode" << std::endl;\n    return 0;\n}',
 python:'print("Hello, DarkwaveCode")',
 javascript:'const place = "Harrow Point";\nconsole.log(`Hello from ${place}`);\nconsole.log(2 + 3);',
 rust:'fn main() {\n    println!("Hello, DarkwaveCode");\n}',
 go:'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, DarkwaveCode")\n}',
 java:'class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, DarkwaveCode");\n    }\n}',
 typescript:'const place: string = "DarkwaveCode";\nconsole.log(`Hello, ${place}`);',
 sql:'SELECT \'Hello, DarkwaveCode\' AS greeting;',
 bash:'#!/usr/bin/env bash\nprintf "Hello, DarkwaveCode\\n"',
 csharp:'using System;\n\n// GhostKernel simulated device lesson\nclass Program {\n    static void Main() {\n        int status = GhostKernel.SysCall("WAKE", 1);\n        Console.WriteLine($"device status: {status}");\n    }\n}',
 powershell:'# GhostKernel simulated device lesson\n$status = Invoke-GhostKernelCall -Operation WAKE -DeviceId 1\nWrite-Output "device status: $status"',
 php:'<?php\n// GhostKernel simulated device lesson\n$status = ghostkernel_sys_call("WAKE", 1);\necho "device status: $status\\n";',
 kotlin:'fun main() {\n    // GhostKernel simulated device lesson\n    val status = GhostKernel.sysCall("WAKE", 1)\n    println("device status: $status")\n}',
 lua:'print("Hello, DarkwaveCode")',
 assembly:'; GhostKernel simulated device lesson — x86-64 NASM\n; A future GhostKernel runtime will map this syscall explicitly.\nsection .text\nglobal _start\n_start:\n    mov rax, 60\n    xor rdi, rdi\n    syscall',
 swift:'// GhostKernel simulated device lesson\nlet status = GhostKernel.sysCall("WAKE", device: 1)\nprint("device status: \\(status)")',
 ruby:'puts "Hello, DarkwaveCode"',
 dart:'void main() {\n  // GhostKernel simulated device lesson\n  final status = GhostKernel.sysCall("WAKE", 1);\n  print("device status: $status");\n}',
 r:'# GhostKernel simulated device lesson\nstatus <- ghostkernel_sys_call("WAKE", 1)\ncat("device status:", status, "\\n")',
 htmlcss:'<!-- GhostKernel lesson workspace · HTML/CSS preview -->\n<main class="device-card">\n  <h1>DEVICE_01</h1>\n  <p class="status">Awaiting simulated WAKE call</p>\n</main>\n<style>\n  body { background: #080910; color: #21e6ff; font-family: monospace; }\n  .device-card { border: 1px solid #21e6ff; padding: 1.5rem; }\n</style>'
};
Object.assign(templates,Object.fromEntries(Object.entries(window.darkwaveExtraLanguages||{}).map(([key,value])=>[key,value.source])));
window.darkwaveStarterTemplates={starter,templates};
})();
