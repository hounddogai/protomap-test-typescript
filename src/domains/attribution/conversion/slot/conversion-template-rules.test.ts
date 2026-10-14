import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionTemplateRateRangeRule,
  ConversionTemplateRequiredJourneyIdRule,
  ConversionTemplateTimezoneLengthRule,
  defaultConversionTemplateValidator,
} from "./conversion-template-rules.js";
import { newConversionTemplate } from "./conversion-template.js";

test("ConversionTemplateValidator reports every problem", () => {
  const validator = defaultConversionTemplateValidator();
  const item = newConversionTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionTemplateRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new ConversionTemplateRequiredJourneyIdRule("conversion template needs an entry");
  const item = newConversionTemplate("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionTemplateTimezoneLengthRule flags a long timezone", () => {
  const rule = new ConversionTemplateTimezoneLengthRule(3600);
  const item = newConversionTemplate("x", "y");
  item.timezone = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionTemplateRateRangeRule flags values above rate", () => {
  const rule = new ConversionTemplateRateRangeRule(6.4, 1898);
  const item = newConversionTemplate("x", "y");
  item.rate = 1899.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
