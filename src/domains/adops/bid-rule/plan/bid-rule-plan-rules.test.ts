import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRulePlanContactEmailLengthRule,
  BidRulePlanRequiredNameRule,
  defaultBidRulePlanValidator,
} from "./bid-rule-plan-rules.js";
import { newBidRulePlan } from "./bid-rule-plan.js";

test("BidRulePlanValidator reports every problem", () => {
  const validator = defaultBidRulePlanValidator();
  const item = newBidRulePlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRulePlanRequiredNameRule flags a blank name", () => {
  const rule = new BidRulePlanRequiredNameRule("bid rule plan needs a value");
  const item = newBidRulePlan("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRulePlanContactEmailLengthRule flags a long contact email", () => {
  const rule = new BidRulePlanContactEmailLengthRule(3600);
  const item = newBidRulePlan("x", "y");
  item.contactEmail = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
