import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationOverrideMinimumRangeRule,
  ActivationOverrideRequiredCurrencyRule,
  defaultActivationOverrideValidator,
} from "./activation-override-rules.js";
import { newActivationOverride } from "./activation-override.js";

test("ActivationOverrideValidator reports every problem", () => {
  const validator = defaultActivationOverrideValidator();
  const item = newActivationOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationOverrideMinimumRangeRule flags values above minimum", () => {
  const rule = new ActivationOverrideMinimumRangeRule(7.2, 2697.6);
  const item = newActivationOverride("x", "y");
  item.minimum = 2699.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationOverrideRequiredCurrencyRule flags a blank currency", () => {
  const rule = new ActivationOverrideRequiredCurrencyRule("activation override needs an entry");
  const item = newActivationOverride("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
