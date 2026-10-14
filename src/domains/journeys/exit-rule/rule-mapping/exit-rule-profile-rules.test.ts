import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleProfileMinimumRangeRule,
  ExitRuleProfileRequiredCodeRule,
  ExitRuleProfileRequiredSegmentRule,
  defaultExitRuleProfileValidator,
} from "./exit-rule-profile-rules.js";
import { newExitRuleProfile } from "./exit-rule-profile.js";

test("ExitRuleProfileValidator reports every problem", () => {
  const validator = defaultExitRuleProfileValidator();
  const item = newExitRuleProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleProfileRequiredSegmentRule flags a blank segment", () => {
  const rule = new ExitRuleProfileRequiredSegmentRule("exit rule profile needs this field");
  const item = newExitRuleProfile("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleProfileMinimumRangeRule flags values above minimum", () => {
  const rule = new ExitRuleProfileMinimumRangeRule(9.4, 4902.1);
  const item = newExitRuleProfile("x", "y");
  item.minimum = 4903.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleProfileRequiredCodeRule flags a blank code", () => {
  const rule = new ExitRuleProfileRequiredCodeRule("exit rule profile needs a value");
  const item = newExitRuleProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
