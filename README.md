# protomap-test-typescript

A synthetic TypeScript code base for testing [ProtoMap](https://protomap.ai) by [HoundDog.ai](https://hounddog.ai). It
is part of the code of Acme, a fictional company.

The code mixes in, on purpose, what makes static analysis of real code bases hard, and `expected.json` is the answer key
of what a scanner should find in it.

Acme's code is spread over multiple repositories, one per programming language. They were generated together from one
catalog of Acme's APIs. Each owns its own domains and calls the others' services, so it holds copies of the protobuf
files it needs from them, byte for byte as their owners have them. Scan them together to follow calls and data from one
repository to another.

| Repository                                                                         | Language   |
|------------------------------------------------------------------------------------|------------|
| [protomap-test-csharp](https://github.com/hounddogai/protomap-test-csharp)         | C#         |
| [protomap-test-golang](https://github.com/hounddogai/protomap-test-golang)         | Go         |
| [protomap-test-java](https://github.com/hounddogai/protomap-test-java)             | Java       |
| [protomap-test-javascript](https://github.com/hounddogai/protomap-test-javascript) | JavaScript |
| [protomap-test-kotlin](https://github.com/hounddogai/protomap-test-kotlin)         | Kotlin     |
| [protomap-test-python](https://github.com/hounddogai/protomap-test-python)         | Python     |
| [protomap-test-rust](https://github.com/hounddogai/protomap-test-rust)             | Rust       |
| [protomap-test-swift](https://github.com/hounddogai/protomap-test-swift)           | Swift      |
| **protomap-test-typescript** (this one)                                            | TypeScript |

## Repository Layout

TypeScript on Node.js with grpc-js:

- `src/domains/`: the engagement teams' handlers, application workflows, protobuf-to-domain mappers, and Knex
  repositories. Teams use feature folders, layered modules, or service folders.
- `src/platform/`: typed gRPC ports, tsyringe wiring, request context, streaming adapters, and an EventEmitter work
  queue.
- `src/server/main.ts`: registers every service behind an identity interceptor and starts the workers.
- `src/jobs/` and `src/admin/`: batch jobs and operator commands.

## Build and Run

Use Node.js 22 or newer, pnpm 12.14.0, and protoc 36.2:

```sh
pnpm install
pnpm build
pnpm test
```

The build runs ts-proto with `outputServices=grpc-js` and `oneof=unions`, and writes the generated bindings to
`.cache/proto/`, which Git ignores. `pnpm check` generates them, then type-checks the strict TypeScript without emitting
JavaScript.

To run the server, set `DATABASE_URL` and run `pnpm migrate`, then set `GRPC_MESH`, `GRPC_LISTEN`, and the service
credential `ACME_SERVICE_TOKEN`, and run `pnpm start`.

## Added Code and Benchmark Labels

`tools/grow` (seed 20261116) added ordinary application code to this repository, and 16 programs whose jobs carry rpc
responses to other rpcs through constructs a static analysis cannot resolve. All of it is under `src/kit/`,
`src/domains/journeys/`, `src/domains/loyaltyhub/`, `src/domains/adops/`, `src/domains/consentcenter/`,
`src/domains/deliverability/`, `src/domains/social/`, `src/domains/attribution/`, `src/domains/referral/`,
`src/domains/support/`, `src/domains/growth/`, `src/ops/`.

- The ordinary code (domain models, validation rules, stores and caches, adjustment engines, reports, workflows, feature
  flags, retries, command-line tools, and unit tests) makes no gRPC calls, so it adds no flows.
- Each planted job reads one rpc's response and hands some of its fields to one or more implementations, each calling
  another rpc. Which implementations run is decidable from the code of the functions on the flow's path. A flow through
  one that runs is in `flows`, with a `pattern` ending in `_real`, or the plain pattern name when every implementation
  runs; one through an implementation that cannot run is in `forbidden_flows`, with the full source and target and a
  pattern ending in `_decoy`.
- `benchmark` in `expected.json` names the generator, its seed, the new patterns, the new code's path and function
  prefixes, and the planted programs' islands. The labels are complete for the new code: every real flow it creates is
  in `flows`, so a flow the scanner reports in the new code that is not there is false.
- New `flows` entries are `known_gap` unless the scanner already finds them. Unlike the other `forbidden_flows`, which
  only name a source, the `_decoy` entries name an endpoint pair; `fixture_coverage.rs`, which reads only their source
  and target kind, lists the ones the scanner reports.

| Pattern | What decides which implementation runs | True | False |
|---|---|---:|---:|
| `direct_call` | nothing: one concrete call, which the scanner finds certain | 48 | 0 |
| `dispatch_closure_map` | a map of closures, one called by a constant key | 73 | 136 |
| `dispatch_filter_loop` | a loop over keyed implementations that skips all but one key | 51 | 103 |
| `dispatch_func_value` | a function value a switch on a constant kind reassigns | 70 | 125 |
| `dispatch_index` | a list of implementations, one taken by a constant index | 71 | 123 |
| `dispatch_registry` | a registry of implementations looked up by a constant key | 105 | 190 |
| `dispatch_runtime` | run-time data, so each implementation may run | 45 | 0 |
| `dispatch_switch` | a selector's switch on a kind its caller passes as a constant | 93 | 168 |
| `fanout_all` | nothing: a loop runs every implementation | 83 | 0 |
| `keyed_slots` | the key each field is stored under and read back by, in a container the scanner folds | 77 | 195 |
