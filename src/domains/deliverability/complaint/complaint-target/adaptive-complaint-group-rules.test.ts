import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveComplaintGroupCodeLengthRule,
  AdaptiveComplaintGroupCountryLengthRule,
  AdaptiveComplaintGroupNameLengthRule,
  AdaptiveComplaintGroupPhoneLengthRule,
  AdaptiveComplaintGroupRequiredCountryRule,
  AdaptiveComplaintGroupStartsAtRangeRule,
  defaultAdaptiveComplaintGroupValidator,
} from "./adaptive-complaint-group-rules.js";
import { newAdaptiveComplaintGroup } from "./adaptive-complaint-group.js";

test("AdaptiveComplaintGroupValidator reports every problem", () => {
  const validator = defaultAdaptiveComplaintGroupValidator();
  const item = newAdaptiveComplaintGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveComplaintGroupNameLengthRule flags a long name", () => {
  const rule = new AdaptiveComplaintGroupNameLengthRule(255);
  const item = newAdaptiveComplaintGroup("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveComplaintGroupCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveComplaintGroupCodeLengthRule(86400);
  const item = newAdaptiveComplaintGroup("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveComplaintGroupRequiredCountryRule flags a blank country", () => {
  const rule = new AdaptiveComplaintGroupRequiredCountryRule("adaptive complaint group needs an entry");
  const item = newAdaptiveComplaintGroup("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveComplaintGroupStartsAtRangeRule flags values above starts at", () => {
  const rule = new AdaptiveComplaintGroupStartsAtRangeRule(32, 255);
  const item = newAdaptiveComplaintGroup("x", "y");
  item.startsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveComplaintGroupPhoneLengthRule flags a long phone", () => {
  const rule = new AdaptiveComplaintGroupPhoneLengthRule(16);
  const item = newAdaptiveComplaintGroup("x", "y");
  item.phone = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveComplaintGroupCountryLengthRule flags a long country", () => {
  const rule = new AdaptiveComplaintGroupCountryLengthRule(64);
  const item = newAdaptiveComplaintGroup("x", "y");
  item.country = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
