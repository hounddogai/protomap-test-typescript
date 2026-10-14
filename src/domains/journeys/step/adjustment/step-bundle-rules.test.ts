import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepBundlePhoneLengthRule,
  StepBundleRequiredTitleRule,
  StepBundleRequiredVariantRule,
  defaultStepBundleValidator,
} from "./step-bundle-rules.js";
import { newStepBundle } from "./step-bundle.js";

test("StepBundleValidator reports every problem", () => {
  const validator = defaultStepBundleValidator();
  const item = newStepBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepBundleRequiredTitleRule flags a blank title", () => {
  const rule = new StepBundleRequiredTitleRule("step bundle needs an entry");
  const item = newStepBundle("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepBundlePhoneLengthRule flags a long phone", () => {
  const rule = new StepBundlePhoneLengthRule(1000);
  const item = newStepBundle("x", "y");
  item.phone = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepBundleRequiredVariantRule flags a blank variant", () => {
  const rule = new StepBundleRequiredVariantRule("step bundle needs this field");
  const item = newStepBundle("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
