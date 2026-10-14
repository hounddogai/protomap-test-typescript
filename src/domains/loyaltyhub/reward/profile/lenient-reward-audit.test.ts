import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientRewardAudit } from "./lenient-reward-audit.js";

test("LenientRewardAudit starts in planned", () => {
  const item = newLenientRewardAudit("code-277", "name-15");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientRewardAudit moves to in progress", () => {
  const item = newLenientRewardAudit("code-277", "name-15");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("LenientRewardAudit rejects moves from cancelled", () => {
  const item = newLenientRewardAudit("code-277", "name-15");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
