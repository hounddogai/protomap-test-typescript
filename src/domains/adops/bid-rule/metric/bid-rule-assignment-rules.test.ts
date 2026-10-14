import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleAssignmentCodeLengthRule,
  BidRuleAssignmentLabelLengthRule,
  BidRuleAssignmentQuantityRangeRule,
  BidRuleAssignmentRequiredCodeRule,
  defaultBidRuleAssignmentValidator,
} from "./bid-rule-assignment-rules.js";
import { newBidRuleAssignment } from "./bid-rule-assignment.js";

test("BidRuleAssignmentValidator reports every problem", () => {
  const validator = defaultBidRuleAssignmentValidator();
  const item = newBidRuleAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleAssignmentLabelLengthRule flags a long label", () => {
  const rule = new BidRuleAssignmentLabelLengthRule(3600);
  const item = newBidRuleAssignment("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleAssignmentQuantityRangeRule flags values above quantity", () => {
  const rule = new BidRuleAssignmentQuantityRangeRule(3600, 86400);
  const item = newBidRuleAssignment("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleAssignmentCodeLengthRule flags a long code", () => {
  const rule = new BidRuleAssignmentCodeLengthRule(120);
  const item = newBidRuleAssignment("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new BidRuleAssignmentRequiredCodeRule("bid rule assignment needs this field");
  const item = newBidRuleAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
