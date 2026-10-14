import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyDeflectionManifestDiscountRangeRule,
  LegacyDeflectionManifestRequiredCohortRule,
  LegacyDeflectionManifestWeightRangeRule,
  defaultLegacyDeflectionManifestValidator,
} from "./legacy-deflection-manifest-rules.js";
import { newLegacyDeflectionManifest } from "./legacy-deflection-manifest.js";

test("LegacyDeflectionManifestValidator reports every problem", () => {
  const validator = defaultLegacyDeflectionManifestValidator();
  const item = newLegacyDeflectionManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyDeflectionManifestWeightRangeRule flags values above weight", () => {
  const rule = new LegacyDeflectionManifestWeightRangeRule(3.5, 1155.9);
  const item = newLegacyDeflectionManifest("x", "y");
  item.weight = 1157.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyDeflectionManifestDiscountRangeRule flags values above discount", () => {
  const rule = new LegacyDeflectionManifestDiscountRangeRule(0.8, 102.4);
  const item = newLegacyDeflectionManifest("x", "y");
  item.discount = 103.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyDeflectionManifestRequiredCohortRule flags a blank cohort", () => {
  const rule = new LegacyDeflectionManifestRequiredCohortRule("legacy deflection manifest needs this field");
  const item = newLegacyDeflectionManifest("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
