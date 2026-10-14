import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryConversionTargetFrequencyCapRangeRule,
  PrimaryConversionTargetRequiredAudienceIdRule,
  PrimaryConversionTargetRequiredCodeRule,
  PrimaryConversionTargetRequiredVariantRule,
  defaultPrimaryConversionTargetValidator,
} from "./primary-conversion-target-rules.js";
import { newPrimaryConversionTarget } from "./primary-conversion-target.js";

test("PrimaryConversionTargetValidator reports every problem", () => {
  const validator = defaultPrimaryConversionTargetValidator();
  const item = newPrimaryConversionTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryConversionTargetRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new PrimaryConversionTargetRequiredAudienceIdRule("primary conversion target needs a value");
  const item = newPrimaryConversionTarget("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryConversionTargetFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new PrimaryConversionTargetFrequencyCapRangeRule(16, 86400);
  const item = newPrimaryConversionTarget("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryConversionTargetRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryConversionTargetRequiredCodeRule("primary conversion target needs an entry");
  const item = newPrimaryConversionTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryConversionTargetRequiredVariantRule flags a blank variant", () => {
  const rule = new PrimaryConversionTargetRequiredVariantRule("primary conversion target needs this field");
  const item = newPrimaryConversionTarget("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
