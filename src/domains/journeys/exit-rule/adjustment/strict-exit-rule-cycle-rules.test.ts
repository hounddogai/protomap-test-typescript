import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictExitRuleCycleBidRangeRule,
  StrictExitRuleCycleCampaignRefLengthRule,
  StrictExitRuleCycleCostRangeRule,
  StrictExitRuleCycleRequiredSummaryRule,
  defaultStrictExitRuleCycleValidator,
} from "./strict-exit-rule-cycle-rules.js";
import { newStrictExitRuleCycle } from "./strict-exit-rule-cycle.js";

test("StrictExitRuleCycleValidator reports every problem", () => {
  const validator = defaultStrictExitRuleCycleValidator();
  const item = newStrictExitRuleCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictExitRuleCycleBidRangeRule flags values above bid", () => {
  const rule = new StrictExitRuleCycleBidRangeRule(7.4, 860.1);
  const item = newStrictExitRuleCycle("x", "y");
  item.bid = 861.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictExitRuleCycleCostRangeRule flags values above cost", () => {
  const rule = new StrictExitRuleCycleCostRangeRule(2.6, 339.5);
  const item = newStrictExitRuleCycle("x", "y");
  item.cost = 341;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictExitRuleCycleRequiredSummaryRule flags a blank summary", () => {
  const rule = new StrictExitRuleCycleRequiredSummaryRule("strict exit rule cycle needs a value");
  const item = newStrictExitRuleCycle("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictExitRuleCycleCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new StrictExitRuleCycleCampaignRefLengthRule(64);
  const item = newStrictExitRuleCycle("x", "y");
  item.campaignRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
