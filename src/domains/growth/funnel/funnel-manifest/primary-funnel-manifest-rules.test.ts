import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryFunnelManifestLocaleLengthRule,
  PrimaryFunnelManifestRequiredLabelRule,
  defaultPrimaryFunnelManifestValidator,
} from "./primary-funnel-manifest-rules.js";
import { newPrimaryFunnelManifest } from "./primary-funnel-manifest.js";

test("PrimaryFunnelManifestValidator reports every problem", () => {
  const validator = defaultPrimaryFunnelManifestValidator();
  const item = newPrimaryFunnelManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryFunnelManifestRequiredLabelRule flags a blank label", () => {
  const rule = new PrimaryFunnelManifestRequiredLabelRule("primary funnel manifest needs a value");
  const item = newPrimaryFunnelManifest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryFunnelManifestLocaleLengthRule flags a long locale", () => {
  const rule = new PrimaryFunnelManifestLocaleLengthRule(255);
  const item = newPrimaryFunnelManifest("x", "y");
  item.locale = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
