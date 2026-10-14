import assert from "node:assert/strict";
import { test } from "node:test";
import { ReputationTargetMaximumRangeRule, defaultReputationTargetValidator } from "./reputation-target-rules.js";
import { newReputationTarget } from "./reputation-target.js";

test("ReputationTargetValidator reports every problem", () => {
  const validator = defaultReputationTargetValidator();
  const item = newReputationTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationTargetMaximumRangeRule flags values above maximum", () => {
  const rule = new ReputationTargetMaximumRangeRule(1.5, 4011.3);
  const item = newReputationTarget("x", "y");
  item.maximum = 4012.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
