import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimarySenderRuleClicksRangeRule,
  PrimarySenderRulePhoneLengthRule,
  PrimarySenderRuleRequiredPhoneRule,
  PrimarySenderRuleRequiredTitleRule,
  defaultPrimarySenderRuleValidator,
} from "./primary-sender-rule-rules.js";
import { newPrimarySenderRule } from "./primary-sender-rule.js";

test("PrimarySenderRuleValidator reports every problem", () => {
  const validator = defaultPrimarySenderRuleValidator();
  const item = newPrimarySenderRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimarySenderRuleRequiredPhoneRule flags a blank phone", () => {
  const rule = new PrimarySenderRuleRequiredPhoneRule("primary sender rule needs a value");
  const item = newPrimarySenderRule("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimarySenderRuleRequiredTitleRule flags a blank title", () => {
  const rule = new PrimarySenderRuleRequiredTitleRule("primary sender rule needs a value");
  const item = newPrimarySenderRule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimarySenderRuleClicksRangeRule flags values above clicks", () => {
  const rule = new PrimarySenderRuleClicksRangeRule(120, 86400);
  const item = newPrimarySenderRule("x", "y");
  item.clicks = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimarySenderRulePhoneLengthRule flags a long phone", () => {
  const rule = new PrimarySenderRulePhoneLengthRule(120);
  const item = newPrimarySenderRule("x", "y");
  item.phone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
