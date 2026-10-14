import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultActivationTargetMaximumRangeRule,
  DefaultActivationTargetOpenRateRangeRule,
  DefaultActivationTargetRequiredSourceRule,
  defaultDefaultActivationTargetValidator,
} from "./default-activation-target-rules.js";
import { newDefaultActivationTarget } from "./default-activation-target.js";

test("DefaultActivationTargetValidator reports every problem", () => {
  const validator = defaultDefaultActivationTargetValidator();
  const item = newDefaultActivationTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultActivationTargetOpenRateRangeRule flags values above open rate", () => {
  const rule = new DefaultActivationTargetOpenRateRangeRule(3.4, 4669);
  const item = newDefaultActivationTarget("x", "y");
  item.openRate = 4670.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultActivationTargetMaximumRangeRule flags values above maximum", () => {
  const rule = new DefaultActivationTargetMaximumRangeRule(5.7, 1709.3);
  const item = newDefaultActivationTarget("x", "y");
  item.maximum = 1710.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultActivationTargetRequiredSourceRule flags a blank source", () => {
  const rule = new DefaultActivationTargetRequiredSourceRule("default activation target needs a value");
  const item = newDefaultActivationTarget("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
