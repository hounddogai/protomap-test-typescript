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
