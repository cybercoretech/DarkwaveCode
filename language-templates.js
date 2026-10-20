window.darkwaveExtraLanguages = {
  zig: {
    file: 'main.zig',
    source: `// GhostKernel simulated device lesson
const WAKE = 1;

pub fn main() void {
    const status = sys_call(WAKE, 1);
    _ = status;
}`
  },
  scala: {
    file: 'Main.scala',
    source: `// GhostKernel simulated device lesson
@main def main(): Unit = {
  val status = sys_call("WAKE", 1)
  println(s"device status: $status")
}`
  },
  julia: {
    file: 'main.jl',
    source: `# GhostKernel simulated device lesson
status = sys_call(:WAKE, 1)
println("device status: $status")`
  },
  perl: {
    file: 'main.pl',
    source: `# GhostKernel simulated device lesson
my $status = sys_call("WAKE", 1);
print "device status: $status\n";`
  },
  haskell: {
    file: 'Main.hs',
    source: `-- GhostKernel simulated device lesson
main :: IO ()
main = do
  let status = sys_call "WAKE" 1
  print status`
  },
  clojure: {
    file: 'main.clj',
    source: `;; GhostKernel simulated device lesson
(ns darkwave.main)

(defn -main []
  (let [status (sys-call :WAKE 1)]
    (println "device status:" status)))`
  },
  crystal: {
    file: 'main.cr',
    source: `# GhostKernel simulated device lesson
status = sys_call("WAKE", 1)
puts "device status: #{status}"`
  },
  elixir: {
    file: 'main.exs',
    source: `# GhostKernel simulated device lesson
status = sys_call(:WAKE, 1)
IO.puts("device status: #{status}")`
  },
  elm: {
    file: 'Main.elm',
    source: `module Main exposing (main)

import Html exposing (text)

main =
    text "GhostKernel: DEVICE_01 is ready for a simulated WAKE"`
  },
  erlang: {
    file: 'main.erl',
    source: `%% GhostKernel simulated device lesson
-module(main).
-export([main/0]).

main() ->
    Status = sys_call(wake, 1),
    io:format("device status: ~p~n", [Status]).`
  },
  groovy: {
    file: 'Main.groovy',
    source: `// GhostKernel simulated device lesson
def status = sys_call("WAKE", 1)
println "device status: \${status}"`
  },
  purescript: {
    file: 'Main.purs',
    source: `module Main where

import Effect (Effect)
import Effect.Console (log)

main :: Effect Unit
main = log "GhostKernel simulation: DEVICE_01 ready"`
  }
};
