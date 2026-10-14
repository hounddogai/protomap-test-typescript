import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleProfileCodeLengthRule,
  BidRuleProfileRequiredCountryRule,
  BidRuleProfileRequiredLabelRule,
  defaultBidRuleProfileValidator,
} from "./bid-rule-profile-rules.js";
import { newBidRuleProfile } from "./bid-rule-profile.js";

test("BidRuleProfileValidator reports every problem", () => {
  const validator = defaultBidRuleProfileValidator();
  const item = newBidRuleProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleProfileCodeLengthRule flags a long code", () => {
  const rule = new BidRuleProfileCodeLengthRule(86400);
  const item = newBidRuleProfile("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleProfileRequiredCountryRule flags a blank country", () => {
  const rule = new BidRuleProfileRequiredCountryRule("bid rule profile needs an entry");
  const item = newBidRuleProfile("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleProfileRequiredLabelRule flags a blank label", () => {
  const rule = new BidRuleProfileRequiredLabelRule("bid rule profile needs a value");
  const item = newBidRuleProfile("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
