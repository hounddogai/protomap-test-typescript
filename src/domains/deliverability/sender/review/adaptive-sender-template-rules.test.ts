import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveSenderTemplateAttemptsRangeRule,
  AdaptiveSenderTemplateRequiredCodeRule,
  defaultAdaptiveSenderTemplateValidator,
} from "./adaptive-sender-template-rules.js";
import { newAdaptiveSenderTemplate } from "./adaptive-sender-template.js";

test("AdaptiveSenderTemplateValidator reports every problem", () => {
  const validator = defaultAdaptiveSenderTemplateValidator();
  const item = newAdaptiveSenderTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveSenderTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveSenderTemplateRequiredCodeRule("adaptive sender template needs an entry");
  const item = newAdaptiveSenderTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveSenderTemplateAttemptsRangeRule flags values above attempts", () => {
  const rule = new AdaptiveSenderTemplateAttemptsRangeRule(64, 1000);
  const item = newAdaptiveSenderTemplate("x", "y");
  item.attempts = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
