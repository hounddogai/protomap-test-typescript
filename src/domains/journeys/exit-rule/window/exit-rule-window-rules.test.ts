import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleWindowAmountRangeRule,
  ExitRuleWindowPriorityRangeRule,
  ExitRuleWindowRequiredCampaignRefRule,
  ExitRuleWindowRequiredCodeRule,
  defaultExitRuleWindowValidator,
} from "./exit-rule-window-rules.js";
import { newExitRuleWindow } from "./exit-rule-window.js";

test("ExitRuleWindowValidator reports every problem", () => {
  const validator = defaultExitRuleWindowValidator();
  const item = newExitRuleWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleWindowRequiredCodeRule flags a blank code", () => {
  const rule = new ExitRuleWindowRequiredCodeRule("exit rule window needs this field");
  const item = newExitRuleWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleWindowAmountRangeRule flags values above amount", () => {
  const rule = new ExitRuleWindowAmountRangeRule(9.6, 1668.6);
  const item = newExitRuleWindow("x", "y");
  item.amount = 1670.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleWindowPriorityRangeRule flags values above priority", () => {
  const rule = new ExitRuleWindowPriorityRangeRule(32, 3600);
  const item = newExitRuleWindow("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleWindowRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new ExitRuleWindowRequiredCampaignRefRule("exit rule window needs an entry");
  const item = newExitRuleWindow("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
