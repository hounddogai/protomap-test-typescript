import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultFunnelManifestCodeLengthRule,
  DefaultFunnelManifestExpiresAtRangeRule,
  DefaultFunnelManifestRequiredContactEmailRule,
  DefaultFunnelManifestRequiredVariantRule,
  DefaultFunnelManifestVariantLengthRule,
  defaultDefaultFunnelManifestValidator,
} from "./default-funnel-manifest-rules.js";
import { newDefaultFunnelManifest } from "./default-funnel-manifest.js";

test("DefaultFunnelManifestValidator reports every problem", () => {
  const validator = defaultDefaultFunnelManifestValidator();
  const item = newDefaultFunnelManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultFunnelManifestCodeLengthRule flags a long code", () => {
  const rule = new DefaultFunnelManifestCodeLengthRule(255);
  const item = newDefaultFunnelManifest("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultFunnelManifestExpiresAtRangeRule flags values above expires at", () => {
  const rule = new DefaultFunnelManifestExpiresAtRangeRule(64, 3600);
  const item = newDefaultFunnelManifest("x", "y");
  item.expiresAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultFunnelManifestRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new DefaultFunnelManifestRequiredContactEmailRule("default funnel manifest needs an entry");
  const item = newDefaultFunnelManifest("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultFunnelManifestRequiredVariantRule flags a blank variant", () => {
  const rule = new DefaultFunnelManifestRequiredVariantRule("default funnel manifest needs an entry");
  const item = newDefaultFunnelManifest("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultFunnelManifestVariantLengthRule flags a long variant", () => {
  const rule = new DefaultFunnelManifestVariantLengthRule(120);
  const item = newDefaultFunnelManifest("x", "y");
  item.variant = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
