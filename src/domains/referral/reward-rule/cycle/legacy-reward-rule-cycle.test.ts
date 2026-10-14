import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyRewardRuleCycle } from "./legacy-reward-rule-cycle.js";

test("LegacyRewardRuleCycle starts in new", () => {
  const item = newLegacyRewardRuleCycle("code-551", "name-709");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyRewardRuleCycle moves to done", () => {
  const item = newLegacyRewardRuleCycle("code-551", "name-709");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("LegacyRewardRuleCycle rejects moves from failed", () => {
  const item = newLegacyRewardRuleCycle("code-551", "name-709");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
