import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalRewardTarget } from "./global-reward-target.js";

test("GlobalRewardTarget starts in requested", () => {
  const item = newGlobalRewardTarget("code-396", "name-28");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalRewardTarget moves to expired", () => {
  const item = newGlobalRewardTarget("code-396", "name-28");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("GlobalRewardTarget rejects moves from expired", () => {
  const item = newGlobalRewardTarget("code-396", "name-28");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
