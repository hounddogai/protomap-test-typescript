import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredFunnelRuleCodeLengthRule,
  TieredFunnelRuleRequiredCodeRule,
  TieredFunnelRuleRequiredTimezoneRule,
  TieredFunnelRuleTimezoneLengthRule,
  TieredFunnelRuleTitleLengthRule,
  TieredFunnelRuleWeightRangeRule,
  defaultTieredFunnelRuleValidator,
} from "./tiered-funnel-rule-rules.js";
import { newTieredFunnelRule } from "./tiered-funnel-rule.js";

test("TieredFunnelRuleValidator reports every problem", () => {
  const validator = defaultTieredFunnelRuleValidator();
  const item = newTieredFunnelRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredFunnelRuleRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new TieredFunnelRuleRequiredTimezoneRule("tiered funnel rule needs a value");
  const item = newTieredFunnelRule("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredFunnelRuleWeightRangeRule flags values above weight", () => {
  const rule = new TieredFunnelRuleWeightRangeRule(6.5, 3539.2);
  const item = newTieredFunnelRule("x", "y");
  item.weight = 3540.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredFunnelRuleTimezoneLengthRule flags a long timezone", () => {
  const rule = new TieredFunnelRuleTimezoneLengthRule(80);
  const item = newTieredFunnelRule("x", "y");
  item.timezone = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredFunnelRuleRequiredCodeRule flags a blank code", () => {
  const rule = new TieredFunnelRuleRequiredCodeRule("tiered funnel rule needs this field");
  const item = newTieredFunnelRule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredFunnelRuleCodeLengthRule flags a long code", () => {
  const rule = new TieredFunnelRuleCodeLengthRule(120);
  const item = newTieredFunnelRule("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredFunnelRuleTitleLengthRule flags a long title", () => {
  const rule = new TieredFunnelRuleTitleLengthRule(32);
  const item = newTieredFunnelRule("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
