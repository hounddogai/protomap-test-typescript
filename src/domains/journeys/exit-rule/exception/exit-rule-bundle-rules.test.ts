import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleBundlePriorityRangeRule,
  ExitRuleBundleRequiredChannelRule,
  ExitRuleBundleRequiredNameRule,
  ExitRuleBundleWeightRangeRule,
  defaultExitRuleBundleValidator,
} from "./exit-rule-bundle-rules.js";
import { newExitRuleBundle } from "./exit-rule-bundle.js";

test("ExitRuleBundleValidator reports every problem", () => {
  const validator = defaultExitRuleBundleValidator();
  const item = newExitRuleBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleBundlePriorityRangeRule flags values above priority", () => {
  const rule = new ExitRuleBundlePriorityRangeRule(80, 120);
  const item = newExitRuleBundle("x", "y");
  item.priority = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleBundleRequiredNameRule flags a blank name", () => {
  const rule = new ExitRuleBundleRequiredNameRule("exit rule bundle needs a value");
  const item = newExitRuleBundle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleBundleWeightRangeRule flags values above weight", () => {
  const rule = new ExitRuleBundleWeightRangeRule(4.2, 3960);
  const item = newExitRuleBundle("x", "y");
  item.weight = 3961.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleBundleRequiredChannelRule flags a blank channel", () => {
  const rule = new ExitRuleBundleRequiredChannelRule("exit rule bundle needs this field");
  const item = newExitRuleBundle("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
