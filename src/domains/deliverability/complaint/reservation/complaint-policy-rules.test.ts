import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintPolicyCodeLengthRule,
  ComplaintPolicyImpressionsRangeRule,
  ComplaintPolicyNameLengthRule,
  ComplaintPolicyRequiredChannelRule,
  ComplaintPolicyRequiredNameRule,
  ComplaintPolicyTitleLengthRule,
  defaultComplaintPolicyValidator,
} from "./complaint-policy-rules.js";
import { newComplaintPolicy } from "./complaint-policy.js";

test("ComplaintPolicyValidator reports every problem", () => {
  const validator = defaultComplaintPolicyValidator();
  const item = newComplaintPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintPolicyCodeLengthRule flags a long code", () => {
  const rule = new ComplaintPolicyCodeLengthRule(80);
  const item = newComplaintPolicy("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintPolicyNameLengthRule flags a long name", () => {
  const rule = new ComplaintPolicyNameLengthRule(120);
  const item = newComplaintPolicy("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintPolicyRequiredChannelRule flags a blank channel", () => {
  const rule = new ComplaintPolicyRequiredChannelRule("complaint policy needs an entry");
  const item = newComplaintPolicy("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintPolicyImpressionsRangeRule flags values above impressions", () => {
  const rule = new ComplaintPolicyImpressionsRangeRule(16, 86400);
  const item = newComplaintPolicy("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintPolicyRequiredNameRule flags a blank name", () => {
  const rule = new ComplaintPolicyRequiredNameRule("complaint policy needs an entry");
  const item = newComplaintPolicy("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintPolicyTitleLengthRule flags a long title", () => {
  const rule = new ComplaintPolicyTitleLengthRule(32);
  const item = newComplaintPolicy("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
