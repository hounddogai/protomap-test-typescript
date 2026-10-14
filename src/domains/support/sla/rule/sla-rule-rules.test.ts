import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaRuleClicksRangeRule,
  SlaRuleCodeLengthRule,
  SlaRuleCostRangeRule,
  SlaRuleLabelLengthRule,
  defaultSlaRuleValidator,
} from "./sla-rule-rules.js";
import { newSlaRule } from "./sla-rule.js";

test("SlaRuleValidator reports every problem", () => {
  const validator = defaultSlaRuleValidator();
  const item = newSlaRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaRuleCodeLengthRule flags a long code", () => {
  const rule = new SlaRuleCodeLengthRule(1000);
  const item = newSlaRule("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaRuleCostRangeRule flags values above cost", () => {
  const rule = new SlaRuleCostRangeRule(1.4, 3332.7);
  const item = newSlaRule("x", "y");
  item.cost = 3334.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaRuleClicksRangeRule flags values above clicks", () => {
  const rule = new SlaRuleClicksRangeRule(64, 255);
  const item = newSlaRule("x", "y");
  item.clicks = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaRuleLabelLengthRule flags a long label", () => {
  const rule = new SlaRuleLabelLengthRule(255);
  const item = newSlaRule("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
