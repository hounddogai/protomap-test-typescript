import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingRewardEntry } from "./pending-reward-entry.js";

test("PendingRewardEntry starts in planned", () => {
  const item = newPendingRewardEntry("code-286", "name-311");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingRewardEntry moves to scheduled", () => {
  const item = newPendingRewardEntry("code-286", "name-311");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("PendingRewardEntry rejects moves from cancelled", () => {
  const item = newPendingRewardEntry("code-286", "name-311");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
