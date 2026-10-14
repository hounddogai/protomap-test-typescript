import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedSlaAudit } from "./batched-sla-audit.js";

test("BatchedSlaAudit starts in requested", () => {
  const item = newBatchedSlaAudit("code-519", "name-567");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedSlaAudit moves to granted", () => {
  const item = newBatchedSlaAudit("code-519", "name-567");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("BatchedSlaAudit rejects moves from expired", () => {
  const item = newBatchedSlaAudit("code-519", "name-567");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
