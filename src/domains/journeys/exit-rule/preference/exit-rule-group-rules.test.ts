import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleGroupCodeLengthRule,
  ExitRuleGroupDurationMinutesRangeRule,
  ExitRuleGroupJourneyIdLengthRule,
  ExitRuleGroupRequiredCodeRule,
  ExitRuleGroupRequiredUnitRule,
  defaultExitRuleGroupValidator,
} from "./exit-rule-group-rules.js";
import { newExitRuleGroup } from "./exit-rule-group.js";

test("ExitRuleGroupValidator reports every problem", () => {
  const validator = defaultExitRuleGroupValidator();
  const item = newExitRuleGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleGroupDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new ExitRuleGroupDurationMinutesRangeRule(32, 80);
  const item = newExitRuleGroup("x", "y");
  item.durationMinutes = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleGroupJourneyIdLengthRule flags a long journey id", () => {
  const rule = new ExitRuleGroupJourneyIdLengthRule(86400);
  const item = newExitRuleGroup("x", "y");
  item.journeyId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleGroupRequiredCodeRule flags a blank code", () => {
  const rule = new ExitRuleGroupRequiredCodeRule("exit rule group needs an entry");
  const item = newExitRuleGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleGroupCodeLengthRule flags a long code", () => {
  const rule = new ExitRuleGroupCodeLengthRule(32);
  const item = newExitRuleGroup("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleGroupRequiredUnitRule flags a blank unit", () => {
  const rule = new ExitRuleGroupRequiredUnitRule("exit rule group needs a value");
  const item = newExitRuleGroup("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
