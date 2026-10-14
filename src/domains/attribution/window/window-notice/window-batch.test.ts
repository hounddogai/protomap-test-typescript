import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowBatch } from "./window-batch.js";

test("WindowBatch starts in requested", () => {
  const item = newWindowBatch("code-90", "label-334");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowBatch moves to revoked", () => {
  const item = newWindowBatch("code-90", "label-334");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("WindowBatch rejects moves from expired", () => {
  const item = newWindowBatch("code-90", "label-334");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
