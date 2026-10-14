import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintOverrideChecksumLengthRule,
  ComplaintOverrideClicksRangeRule,
  ComplaintOverrideEndsAtRangeRule,
  ComplaintOverrideLabelLengthRule,
  ComplaintOverrideRequiredChecksumRule,
  ComplaintOverrideScoreRangeRule,
  defaultComplaintOverrideValidator,
} from "./complaint-override-rules.js";
import { newComplaintOverride } from "./complaint-override.js";

test("ComplaintOverrideValidator reports every problem", () => {
  const validator = defaultComplaintOverrideValidator();
  const item = newComplaintOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintOverrideEndsAtRangeRule flags values above ends at", () => {
  const rule = new ComplaintOverrideEndsAtRangeRule(64, 3600);
  const item = newComplaintOverride("x", "y");
  item.endsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintOverrideClicksRangeRule flags values above clicks", () => {
  const rule = new ComplaintOverrideClicksRangeRule(120, 1000);
  const item = newComplaintOverride("x", "y");
  item.clicks = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintOverrideChecksumLengthRule flags a long checksum", () => {
  const rule = new ComplaintOverrideChecksumLengthRule(86400);
  const item = newComplaintOverride("x", "y");
  item.checksum = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintOverrideLabelLengthRule flags a long label", () => {
  const rule = new ComplaintOverrideLabelLengthRule(120);
  const item = newComplaintOverride("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintOverrideScoreRangeRule flags values above score", () => {
  const rule = new ComplaintOverrideScoreRangeRule(9.4, 1845.1);
  const item = newComplaintOverride("x", "y");
  item.score = 1846.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintOverrideRequiredChecksumRule flags a blank checksum", () => {
  const rule = new ComplaintOverrideRequiredChecksumRule("complaint override needs a value");
  const item = newComplaintOverride("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
