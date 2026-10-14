# protomap-test-typescript

A synthetic code base of the fictional company Acme for testing ProtoMap: 290 gRPC services with 2232 methods in 15
domains, and 8181 protobuf messages with 35506 fields, many nested several levels deep.

It was generated, with the eight other `protomap-test-*` repositories, from one catalog of Acme's APIs. The repositories
own disjoint domains and call each other's services, so each holds copies of the protobuf files it needs from the
others, byte for byte as their owners have them.

## Layout

`src/domains/` contains the engagement teams' handlers, application workflows, protobuf/domain mappers, and Knex
repositories. Teams use feature folders, layered modules, or service folders; `src/platform/` supplies typed gRPC ports,
tsyringe wiring, request context, streaming adapters, and an EventEmitter work queue. `src/server/main.ts` registers
every service behind an identity interceptor and starts the workers; `src/jobs/` and `src/admin/` hold batch jobs and
operator commands. Use Node.js 22 or newer, pnpm 12.14.0, and protoc 36.2: `pnpm install`, `pnpm build`, and `pnpm
test`. `pnpm check` generates bindings then checks strict TypeScript without emitting JavaScript. The build runs
ts-proto with `outputServices=grpc-js` and `oneof=unions`; generated bindings live in the ignored `.cache/proto/`
directory and are never committed. Set `DATABASE_URL`, run `pnpm migrate`, and set `GRPC_MESH`, `GRPC_LISTEN`, and the
service credential `ACME_SERVICE_TOKEN` before `pnpm start`. Only event-queue handoffs are marked as known gaps in the
oracle.

The domains are `webbff`, `notifications`, `messaging`, `campaigns`, `audiences`, `content`, `media`, `forms`,
`surveys`, `chat`, `webhooks`, `localization`, `experiments`, `personalization`, `community`. It calls services of
`accounting`, `admissions`, `analytics`, `anomalies`, `appointments`, `assets`, `audit`, `authorization`, `banking`,
`billing`, `boxoffice`, `broadcasts`, `budgeting`, `careplans`, `cart`, `catalog`, `certificates`, `collections`,
`compliance`, `concessions`, `configuration`, `contracts`, `corporateevents`, `customers`, `datahub`, `datasets`,
`deliveries`, `devices`, `dispatch`, `documents`, `driverapp`, `drivers`, `edgegateway`, `employees`, `fanportal`,
`featureflags`, `featurestore`, `fleet`, `forecasting`, `fuel`, `fulfillment`, `giftcards`, `helpdesk`, `identity`,
`insurance`, `inventory`, `invoicing`, `itsm`, `keymanagement`, `labeling`, `ledger`, `lending`, `licensing`, `lineage`,
`loyalty`, `maintenance`, `merchandising`, `metrics`, `modelregistry`, `onboarding`, `orders`, `patientapp`, `patients`,
`payments`, `payroll`, `performance`, `performers`, `pipelines`, `prescriptions`, `pricing`, `procurement`,
`promotions`, `ratelimiting`, `recommendations`, `recruiting`, `returns`, `risk`, `routing`, `scheduling`, `search`,
`seating`, `secrets`, `sellers`, `shows`, `sponsorships`, `subscriptions`, `suppliers`, `telehealth`, `telematics`,
`ticketing`, `tours`, `travel`, `venues`, `warehousing`, `workplaces`, `yards` too.

## Oracle

`expected.json` lists what scanning the repository must find: every handler, every call a handler or a program makes,
and every field-level flow from where a handler has data to where a call or its response takes it, each tagged with the
shape of the code that makes it. `crates/graph/tests/fixture_coverage.rs` in `protomap-source` checks a scan against it.

The code mixes in, on purpose, what makes static analysis of real code bases hard. Flows by pattern:

| Pattern | Flows |
|---|---|
| `any_envelope` | 991 |
| `async_context` | 785 |
| `bidi_call` | 188 |
| `callback_bridge` | 974 |
| `client_stream_call` | 158 |
| `closure_loop` | 270 |
| `destructure` | 979 |
| `dynamic_method` | 1016 |
| `echo` | 3276 |
| `event_worker` | 1002 |
| `generic_call` | 788 |
| `higher_order` | 1010 |
| `json_roundtrip` | 831 |
| `object_spread` | 996 |
| `oneof_switch` | 1177 |
| `port_adapter` | 999 |
| `program_batch` | 32 |
| `promise_all` | 252 |
| `promise_all_settled` | 265 |
| `promisified_client` | 969 |
| `proto_json_roundtrip` | 988 |
| `proxy_forward` | 995 |
| `registry_map` | 776 |
| `retry_closure` | 988 |
| `server_stream_call` | 578 |
| `util_promisify` | 806 |
| `workflow_pipeline` | 784 |

Flows whose values pass through something on their way, by what:

| Transform | Flows |
|---|---|
| `any_envelope` | 678 |
| `array_map` | 124 |
| `destructure` | 675 |
| `json_roundtrip` | 580 |
| `map_entries` | 584 |
| `object_spread` | 686 |
| `oneof_switch` | 283 |
| `proto_json_roundtrip` | 689 |
| `response_merge` | 8396 |

Calls by pattern:

| Pattern | Calls |
|---|---|
| `any_envelope` | 206 |
| `async_context` | 169 |
| `bidi_call` | 48 |
| `callback_bridge` | 206 |
| `client_stream_call` | 48 |
| `closure_loop` | 71 |
| `destructure` | 206 |
| `dynamic_method` | 206 |
| `event_worker` | 206 |
| `generic_call` | 164 |
| `higher_order` | 206 |
| `json_roundtrip` | 172 |
| `object_spread` | 206 |
| `oneof_switch` | 219 |
| `port_adapter` | 206 |
| `program_batch` | 32 |
| `program_cli` | 8 |
| `promise_all` | 71 |
| `promise_all_settled` | 71 |
| `promisified_client` | 206 |
| `proto_json_roundtrip` | 206 |
| `proxy_forward` | 206 |
| `registry_map` | 170 |
| `retry_closure` | 206 |
| `server_stream_call` | 170 |
| `util_promisify` | 171 |
| `workflow_pipeline` | 170 |
