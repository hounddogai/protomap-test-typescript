import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalSenderMappingLabelLengthRule,
  RegionalSenderMappingRequiredCodeRule,
  RegionalSenderMappingRequiredVariantRule,
  RegionalSenderMappingWeightRangeRule,
  defaultRegionalSenderMappingValidator,
} from "./regional-sender-mapping-rules.js";
import { newRegionalSenderMapping } from "./regional-sender-mapping.js";

test("RegionalSenderMappingValidator reports every problem", () => {
  const validator = defaultRegionalSenderMappingValidator();
  const item = newRegionalSenderMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalSenderMappingWeightRangeRule flags values above weight", () => {
  const rule = new RegionalSenderMappingWeightRangeRule(1.1, 1829.1);
  const item = newRegionalSenderMapping("x", "y");
  item.weight = 1830.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalSenderMappingRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalSenderMappingRequiredCodeRule("regional sender mapping needs a value");
  const item = newRegionalSenderMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalSenderMappingLabelLengthRule flags a long label", () => {
  const rule = new RegionalSenderMappingLabelLengthRule(255);
  const item = newRegionalSenderMapping("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalSenderMappingRequiredVariantRule flags a blank variant", () => {
  const rule = new RegionalSenderMappingRequiredVariantRule("regional sender mapping needs a value");
  const item = newRegionalSenderMapping("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
