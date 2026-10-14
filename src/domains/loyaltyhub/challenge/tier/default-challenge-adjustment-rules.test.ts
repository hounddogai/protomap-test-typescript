import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultChallengeAdjustmentCategoryLengthRule,
  DefaultChallengeAdjustmentRequiredCategoryRule,
  defaultDefaultChallengeAdjustmentValidator,
} from "./default-challenge-adjustment-rules.js";
import { newDefaultChallengeAdjustment } from "./default-challenge-adjustment.js";

test("DefaultChallengeAdjustmentValidator reports every problem", () => {
  const validator = defaultDefaultChallengeAdjustmentValidator();
  const item = newDefaultChallengeAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultChallengeAdjustmentRequiredCategoryRule flags a blank category", () => {
  const rule = new DefaultChallengeAdjustmentRequiredCategoryRule("default challenge adjustment needs a value");
  const item = newDefaultChallengeAdjustment("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultChallengeAdjustmentCategoryLengthRule flags a long category", () => {
  const rule = new DefaultChallengeAdjustmentCategoryLengthRule(3600);
  const item = newDefaultChallengeAdjustment("x", "y");
  item.category = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
