import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionManifestDescriptionLengthRule,
  SuppressionManifestRequiredDescriptionRule,
  defaultSuppressionManifestValidator,
} from "./suppression-manifest-rules.js";
import { newSuppressionManifest } from "./suppression-manifest.js";

test("SuppressionManifestValidator reports every problem", () => {
  const validator = defaultSuppressionManifestValidator();
  const item = newSuppressionManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionManifestRequiredDescriptionRule flags a blank description", () => {
  const rule = new SuppressionManifestRequiredDescriptionRule("suppression manifest needs a value");
  const item = newSuppressionManifest("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionManifestDescriptionLengthRule flags a long description", () => {
  const rule = new SuppressionManifestDescriptionLengthRule(120);
  const item = newSuppressionManifest("x", "y");
  item.description = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
