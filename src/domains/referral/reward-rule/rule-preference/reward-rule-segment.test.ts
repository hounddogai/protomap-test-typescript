import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleSegment } from "./reward-rule-segment.js";

test("RewardRuleSegment starts in requested", () => {
  const item = newRewardRuleSegment("code-839", "name-260");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleSegment moves to granted", () => {
  const item = newRewardRuleSegment("code-839", "name-260");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RewardRuleSegment rejects moves from expired", () => {
  const item = newRewardRuleSegment("code-839", "name-260");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
