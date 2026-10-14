import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedInviteTargetCodeLengthRule,
  WeightedInviteTargetRequiredCodeRule,
  WeightedInviteTargetTitleLengthRule,
  WeightedInviteTargetUpdatedAtRangeRule,
  defaultWeightedInviteTargetValidator,
} from "./weighted-invite-target-rules.js";
import { newWeightedInviteTarget } from "./weighted-invite-target.js";

test("WeightedInviteTargetValidator reports every problem", () => {
  const validator = defaultWeightedInviteTargetValidator();
  const item = newWeightedInviteTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedInviteTargetTitleLengthRule flags a long title", () => {
  const rule = new WeightedInviteTargetTitleLengthRule(1000);
  const item = newWeightedInviteTarget("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedInviteTargetCodeLengthRule flags a long code", () => {
  const rule = new WeightedInviteTargetCodeLengthRule(64);
  const item = newWeightedInviteTarget("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedInviteTargetUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new WeightedInviteTargetUpdatedAtRangeRule(16, 3600);
  const item = newWeightedInviteTarget("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedInviteTargetRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedInviteTargetRequiredCodeRule("weighted invite target needs an entry");
  const item = newWeightedInviteTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
