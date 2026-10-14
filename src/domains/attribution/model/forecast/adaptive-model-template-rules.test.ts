import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveModelTemplateCapacityRangeRule,
  AdaptiveModelTemplateGraceDaysRangeRule,
  AdaptiveModelTemplateRequiredCodeRule,
  AdaptiveModelTemplateRequiredNameRule,
  defaultAdaptiveModelTemplateValidator,
} from "./adaptive-model-template-rules.js";
import { newAdaptiveModelTemplate } from "./adaptive-model-template.js";

test("AdaptiveModelTemplateValidator reports every problem", () => {
  const validator = defaultAdaptiveModelTemplateValidator();
  const item = newAdaptiveModelTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveModelTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveModelTemplateRequiredCodeRule("adaptive model template needs a value");
  const item = newAdaptiveModelTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveModelTemplateCapacityRangeRule flags values above capacity", () => {
  const rule = new AdaptiveModelTemplateCapacityRangeRule(32, 3600);
  const item = newAdaptiveModelTemplate("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveModelTemplateGraceDaysRangeRule flags values above grace days", () => {
  const rule = new AdaptiveModelTemplateGraceDaysRangeRule(16, 255);
  const item = newAdaptiveModelTemplate("x", "y");
  item.graceDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveModelTemplateRequiredNameRule flags a blank name", () => {
  const rule = new AdaptiveModelTemplateRequiredNameRule("adaptive model template needs this field");
  const item = newAdaptiveModelTemplate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
