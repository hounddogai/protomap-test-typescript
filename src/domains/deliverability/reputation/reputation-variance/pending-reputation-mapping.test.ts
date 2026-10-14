import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingReputationMapping } from "./pending-reputation-mapping.js";

test("PendingReputationMapping starts in planned", () => {
  const item = newPendingReputationMapping("code-990", "title-804");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingReputationMapping moves to completed", () => {
  const item = newPendingReputationMapping("code-990", "title-804");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("PendingReputationMapping rejects moves from cancelled", () => {
  const item = newPendingReputationMapping("code-990", "title-804");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
