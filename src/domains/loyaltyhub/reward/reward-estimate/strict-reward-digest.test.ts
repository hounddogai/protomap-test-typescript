import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictRewardDigest } from "./strict-reward-digest.js";

test("StrictRewardDigest starts in planned", () => {
  const item = newStrictRewardDigest("code-913", "label-574");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictRewardDigest moves to cancelled", () => {
  const item = newStrictRewardDigest("code-913", "label-574");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("StrictRewardDigest rejects moves from cancelled", () => {
  const item = newStrictRewardDigest("code-913", "label-574");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
