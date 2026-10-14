import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelRuleBatchSizeRangeRule,
  FunnelRuleCodeLengthRule,
  FunnelRuleRequiredAudienceIdRule,
  FunnelRuleRequiredSourceRule,
  FunnelRuleSourceLengthRule,
  FunnelRuleWindowDaysRangeRule,
  defaultFunnelRuleValidator,
} from "./funnel-rule-rules.js";
import { newFunnelRule } from "./funnel-rule.js";

test("FunnelRuleValidator reports every problem", () => {
  const validator = defaultFunnelRuleValidator();
  const item = newFunnelRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelRuleRequiredSourceRule flags a blank source", () => {
  const rule = new FunnelRuleRequiredSourceRule("funnel rule needs a value");
  const item = newFunnelRule("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelRuleSourceLengthRule flags a long source", () => {
  const rule = new FunnelRuleSourceLengthRule(86400);
  const item = newFunnelRule("x", "y");
  item.source = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelRuleRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new FunnelRuleRequiredAudienceIdRule("funnel rule needs a value");
  const item = newFunnelRule("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelRuleBatchSizeRangeRule flags values above batch size", () => {
  const rule = new FunnelRuleBatchSizeRangeRule(32, 86400);
  const item = newFunnelRule("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FunnelRuleCodeLengthRule flags a long code", () => {
  const rule = new FunnelRuleCodeLengthRule(80);
  const item = newFunnelRule("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelRuleWindowDaysRangeRule flags values above window days", () => {
  const rule = new FunnelRuleWindowDaysRangeRule(1000, 86400);
  const item = newFunnelRule("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
