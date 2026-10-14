import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientRewardRuleMilestone } from "./lenient-reward-rule-milestone.js";

test("LenientRewardRuleMilestone starts in requested", () => {
  const item = newLenientRewardRuleMilestone("code-51", "title-500");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientRewardRuleMilestone moves to granted", () => {
  const item = newLenientRewardRuleMilestone("code-51", "title-500");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("LenientRewardRuleMilestone rejects moves from expired", () => {
  const item = newLenientRewardRuleMilestone("code-51", "title-500");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
