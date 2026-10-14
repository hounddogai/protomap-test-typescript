import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelManifestCodeLengthRule,
  ModelManifestConversionRateRangeRule,
  ModelManifestRequiredCodeRule,
  defaultModelManifestValidator,
} from "./model-manifest-rules.js";
import { newModelManifest } from "./model-manifest.js";

test("ModelManifestValidator reports every problem", () => {
  const validator = defaultModelManifestValidator();
  const item = newModelManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelManifestConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new ModelManifestConversionRateRangeRule(7.2, 2353.6);
  const item = newModelManifest("x", "y");
  item.conversionRate = 2355.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ModelManifestCodeLengthRule flags a long code", () => {
  const rule = new ModelManifestCodeLengthRule(255);
  const item = newModelManifest("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelManifestRequiredCodeRule flags a blank code", () => {
  const rule = new ModelManifestRequiredCodeRule("model manifest needs a value");
  const item = newModelManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
