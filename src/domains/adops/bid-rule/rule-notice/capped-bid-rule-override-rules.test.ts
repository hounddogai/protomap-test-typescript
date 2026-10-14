import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedBidRuleOverrideDescriptionLengthRule,
  CappedBidRuleOverrideRequiredCodeRule,
  defaultCappedBidRuleOverrideValidator,
} from "./capped-bid-rule-override-rules.js";
import { newCappedBidRuleOverride } from "./capped-bid-rule-override.js";

test("CappedBidRuleOverrideValidator reports every problem", () => {
  const validator = defaultCappedBidRuleOverrideValidator();
  const item = newCappedBidRuleOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedBidRuleOverrideDescriptionLengthRule flags a long description", () => {
  const rule = new CappedBidRuleOverrideDescriptionLengthRule(120);
  const item = newCappedBidRuleOverride("x", "y");
  item.description = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedBidRuleOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new CappedBidRuleOverrideRequiredCodeRule("capped bid rule override needs an entry");
  const item = newCappedBidRuleOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
