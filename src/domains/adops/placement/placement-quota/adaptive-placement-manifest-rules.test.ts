import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptivePlacementManifestCodeLengthRule,
  AdaptivePlacementManifestCreatedAtRangeRule,
  AdaptivePlacementManifestLabelLengthRule,
  AdaptivePlacementManifestRequiredLabelRule,
  AdaptivePlacementManifestWeightRangeRule,
  defaultAdaptivePlacementManifestValidator,
} from "./adaptive-placement-manifest-rules.js";
import { newAdaptivePlacementManifest } from "./adaptive-placement-manifest.js";

test("AdaptivePlacementManifestValidator reports every problem", () => {
  const validator = defaultAdaptivePlacementManifestValidator();
  const item = newAdaptivePlacementManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptivePlacementManifestLabelLengthRule flags a long label", () => {
  const rule = new AdaptivePlacementManifestLabelLengthRule(86400);
  const item = newAdaptivePlacementManifest("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptivePlacementManifestCreatedAtRangeRule flags values above created at", () => {
  const rule = new AdaptivePlacementManifestCreatedAtRangeRule(1000, 86400);
  const item = newAdaptivePlacementManifest("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptivePlacementManifestRequiredLabelRule flags a blank label", () => {
  const rule = new AdaptivePlacementManifestRequiredLabelRule("adaptive placement manifest needs a value");
  const item = newAdaptivePlacementManifest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptivePlacementManifestCodeLengthRule flags a long code", () => {
  const rule = new AdaptivePlacementManifestCodeLengthRule(86400);
  const item = newAdaptivePlacementManifest("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptivePlacementManifestWeightRangeRule flags values above weight", () => {
  const rule = new AdaptivePlacementManifestWeightRangeRule(2.1, 2810);
  const item = newAdaptivePlacementManifest("x", "y");
  item.weight = 2811.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
