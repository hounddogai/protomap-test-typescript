import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredRewardRuleCycle } from "./tiered-reward-rule-cycle.js";

test("TieredRewardRuleCycle starts in created", () => {
  const item = newTieredRewardRuleCycle("code-821", "name-652");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredRewardRuleCycle moves to published", () => {
  const item = newTieredRewardRuleCycle("code-821", "name-652");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("TieredRewardRuleCycle rejects moves from retired", () => {
  const item = newTieredRewardRuleCycle("code-821", "name-652");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
