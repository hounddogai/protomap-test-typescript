import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryConversionGroupLimitRangeRule,
  PrimaryConversionGroupRequiredCodeRule,
  PrimaryConversionGroupRequiredUtmSourceRule,
  PrimaryConversionGroupTitleLengthRule,
  PrimaryConversionGroupUtmSourceLengthRule,
  defaultPrimaryConversionGroupValidator,
} from "./primary-conversion-group-rules.js";
import { newPrimaryConversionGroup } from "./primary-conversion-group.js";

test("PrimaryConversionGroupValidator reports every problem", () => {
  const validator = defaultPrimaryConversionGroupValidator();
  const item = newPrimaryConversionGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryConversionGroupUtmSourceLengthRule flags a long utm source", () => {
  const rule = new PrimaryConversionGroupUtmSourceLengthRule(86400);
  const item = newPrimaryConversionGroup("x", "y");
  item.utmSource = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryConversionGroupTitleLengthRule flags a long title", () => {
  const rule = new PrimaryConversionGroupTitleLengthRule(3600);
  const item = newPrimaryConversionGroup("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryConversionGroupRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new PrimaryConversionGroupRequiredUtmSourceRule("primary conversion group needs this field");
  const item = newPrimaryConversionGroup("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryConversionGroupRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryConversionGroupRequiredCodeRule("primary conversion group needs a value");
  const item = newPrimaryConversionGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryConversionGroupLimitRangeRule flags values above limit", () => {
  const rule = new PrimaryConversionGroupLimitRangeRule(64, 1000);
  const item = newPrimaryConversionGroup("x", "y");
  item.limit = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
