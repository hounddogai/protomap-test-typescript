import "reflect-metadata";
import assert from "node:assert/strict";
import { test } from "node:test";
import { Client, credentials, status } from "@grpc/grpc-js";
import { forwarding } from "./rpc.js";
import { ClientRegistry } from "./registry.js";
import { WorkQueue } from "./work-queue.js";
import { serviceError } from "./errors.js";
import { RequestContext } from "../../.cache/proto/acme/common/v1/context.js";
import { mergeResponses } from "./merge.js";

test("response enrichment keeps earlier nonempty fields and appends repeated contributions", () => {
  const first = { result: { status: "", message: "created" }, records: ["one"] };
  const second = { result: { status: "ok", message: "" }, records: ["two"] };
  assert.deepEqual(mergeResponses(first, second), {
    result: { status: "ok", message: "created" }, records: ["one", "two"],
  });
  assert.deepEqual(first.records, ["one"]);
});

test("workers preserve nested values across concurrent request/reply events", async () => {
  const queue = new WorkQueue();
  queue.consume<RequestContext, RequestContext>("context", async (request) => RequestContext.decode(
    RequestContext.encode(request).finish()));
  try {
    const inputs = ["alpha", "beta"].map((tenantId) => RequestContext.fromPartial({ tenantId,
      actor: { roles: ["operator"], email: `${tenantId}@acme.test` }, baggage: { route: tenantId } }));
    const replies = await Promise.all(inputs.map((input) => queue.enqueue("context", input)));
    assert.deepEqual(replies, inputs);
  } finally { queue.close(); }
});

test("a missing worker fails promptly and shutdown rejects pending work", async () => {
  const queue = new WorkQueue();
  await assert.rejects(queue.enqueue("missing", {}), { code: status.UNAVAILABLE });
  queue.consume("blocked", async () => new Promise(() => {}));
  const pending = queue.enqueue("blocked", {});
  queue.close();
  await assert.rejects(pending, { code: status.CANCELLED });
});

test("forwarding preserves receivers and registry entries close their channels", () => {
  const object = { prefix: "acme", label(value: string) { return this.prefix + value; } };
  const fn = forwarding(object).label;
  assert.equal(fn("-team"), "acme-team");
  const registry = new ClientRegistry();
  const client = new Client("127.0.0.1:1", credentials.createInsecure());
  try {
    registry.put("identity", client);
    assert.equal(registry.get("identity"), client);
    assert.throws(() => registry.get("absent"), { code: status.FAILED_PRECONDITION });
  } finally { registry.close(); }
});

test("unexpected failures do not disclose database details", () => {
  const error = serviceError(new Error("postgres connection contained a password"));
  assert.equal(error.code, status.INTERNAL);
  assert.equal(error.details, "The operation could not be completed");
});
