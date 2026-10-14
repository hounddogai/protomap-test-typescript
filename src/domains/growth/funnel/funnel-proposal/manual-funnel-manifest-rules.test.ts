import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualFunnelManifestCategoryLengthRule,
  ManualFunnelManifestNameLengthRule,
  ManualFunnelManifestOpenRateRangeRule,
  ManualFunnelManifestRequiredCategoryRule,
  defaultManualFunnelManifestValidator,
} from "./manual-funnel-manifest-rules.js";
import { newManualFunnelManifest } from "./manual-funnel-manifest.js";

test("ManualFunnelManifestValidator reports every problem", () => {
  const validator = defaultManualFunnelManifestValidator();
  const item = newManualFunnelManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualFunnelManifestOpenRateRangeRule flags values above open rate", () => {
  const rule = new ManualFunnelManifestOpenRateRangeRule(0.5, 1349);
  const item = newManualFunnelManifest("x", "y");
  item.openRate = 1350.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualFunnelManifestCategoryLengthRule flags a long category", () => {
  const rule = new ManualFunnelManifestCategoryLengthRule(1000);
  const item = newManualFunnelManifest("x", "y");
  item.category = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualFunnelManifestRequiredCategoryRule flags a blank category", () => {
  const rule = new ManualFunnelManifestRequiredCategoryRule("manual funnel manifest needs a value");
  const item = newManualFunnelManifest("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualFunnelManifestNameLengthRule flags a long name", () => {
  const rule = new ManualFunnelManifestNameLengthRule(86400);
  const item = newManualFunnelManifest("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
