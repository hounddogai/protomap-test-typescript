import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictRewardQuota } from "./strict-reward-quota.js";

test("StrictRewardQuota starts in planned", () => {
  const item = newStrictRewardQuota("code-198", "name-570");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictRewardQuota moves to scheduled", () => {
  const item = newStrictRewardQuota("code-198", "name-570");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("StrictRewardQuota rejects moves from cancelled", () => {
  const item = newStrictRewardQuota("code-198", "name-570");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
