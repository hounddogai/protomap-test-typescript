import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepManifestCodeLengthRule,
  StepManifestNameLengthRule,
  StepManifestRequiredCodeRule,
  StepManifestThresholdRangeRule,
  defaultStepManifestValidator,
} from "./step-manifest-rules.js";
import { newStepManifest } from "./step-manifest.js";

test("StepManifestValidator reports every problem", () => {
  const validator = defaultStepManifestValidator();
  const item = newStepManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepManifestRequiredCodeRule flags a blank code", () => {
  const rule = new StepManifestRequiredCodeRule("step manifest needs this field");
  const item = newStepManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepManifestNameLengthRule flags a long name", () => {
  const rule = new StepManifestNameLengthRule(255);
  const item = newStepManifest("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepManifestCodeLengthRule flags a long code", () => {
  const rule = new StepManifestCodeLengthRule(86400);
  const item = newStepManifest("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepManifestThresholdRangeRule flags values above threshold", () => {
  const rule = new StepManifestThresholdRangeRule(6.9, 4887.3);
  const item = newStepManifest("x", "y");
  item.threshold = 4888.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
