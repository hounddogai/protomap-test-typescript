import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitAdjustment } from "./wait-adjustment.js";

test("WaitAdjustment starts in requested", () => {
  const item = newWaitAdjustment("code-549", "name-798");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitAdjustment moves to revoked", () => {
  const item = newWaitAdjustment("code-549", "name-798");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("WaitAdjustment rejects moves from expired", () => {
  const item = newWaitAdjustment("code-549", "name-798");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
