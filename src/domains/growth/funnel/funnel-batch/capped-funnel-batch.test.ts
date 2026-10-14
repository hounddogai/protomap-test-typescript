import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedFunnelBatch } from "./capped-funnel-batch.js";

test("CappedFunnelBatch starts in created", () => {
  const item = newCappedFunnelBatch("code-32", "name-489");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedFunnelBatch moves to validated", () => {
  const item = newCappedFunnelBatch("code-32", "name-489");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("CappedFunnelBatch rejects moves from retired", () => {
  const item = newCappedFunnelBatch("code-32", "name-489");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
