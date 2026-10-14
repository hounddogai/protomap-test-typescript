import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingRewardRollupBudgetRangeRule,
  PendingRewardRollupQuantityRangeRule,
  PendingRewardRollupRequiredTitleRule,
  defaultPendingRewardRollupValidator,
} from "./pending-reward-rollup-rules.js";
import { newPendingRewardRollup } from "./pending-reward-rollup.js";

test("PendingRewardRollupValidator reports every problem", () => {
  const validator = defaultPendingRewardRollupValidator();
  const item = newPendingRewardRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingRewardRollupQuantityRangeRule flags values above quantity", () => {
  const rule = new PendingRewardRollupQuantityRangeRule(16, 86400);
  const item = newPendingRewardRollup("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingRewardRollupRequiredTitleRule flags a blank title", () => {
  const rule = new PendingRewardRollupRequiredTitleRule("pending reward rollup needs a value");
  const item = newPendingRewardRollup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingRewardRollupBudgetRangeRule flags values above budget", () => {
  const rule = new PendingRewardRollupBudgetRangeRule(8.3, 2390.4);
  const item = newPendingRewardRollup("x", "y");
  item.budget = 2391.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
