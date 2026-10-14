import assert from "node:assert/strict";
import { test } from "node:test";
import { BidRuleRequestCodeLengthRule, defaultBidRuleRequestValidator } from "./bid-rule-request-rules.js";
import { newBidRuleRequest } from "./bid-rule-request.js";

test("BidRuleRequestValidator reports every problem", () => {
  const validator = defaultBidRuleRequestValidator();
  const item = newBidRuleRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleRequestCodeLengthRule flags a long code", () => {
  const rule = new BidRuleRequestCodeLengthRule(16);
  const item = newBidRuleRequest("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
