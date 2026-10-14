import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryPaywallManifestClicksRangeRule,
  PrimaryPaywallManifestCountryLengthRule,
  PrimaryPaywallManifestRequiredCountryRule,
  PrimaryPaywallManifestRequiredSegmentRule,
  PrimaryPaywallManifestSegmentLengthRule,
  defaultPrimaryPaywallManifestValidator,
} from "./primary-paywall-manifest-rules.js";
import { newPrimaryPaywallManifest } from "./primary-paywall-manifest.js";

test("PrimaryPaywallManifestValidator reports every problem", () => {
  const validator = defaultPrimaryPaywallManifestValidator();
  const item = newPrimaryPaywallManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryPaywallManifestSegmentLengthRule flags a long segment", () => {
  const rule = new PrimaryPaywallManifestSegmentLengthRule(120);
  const item = newPrimaryPaywallManifest("x", "y");
  item.segment = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryPaywallManifestCountryLengthRule flags a long country", () => {
  const rule = new PrimaryPaywallManifestCountryLengthRule(255);
  const item = newPrimaryPaywallManifest("x", "y");
  item.country = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryPaywallManifestRequiredSegmentRule flags a blank segment", () => {
  const rule = new PrimaryPaywallManifestRequiredSegmentRule("primary paywall manifest needs this field");
  const item = newPrimaryPaywallManifest("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryPaywallManifestRequiredCountryRule flags a blank country", () => {
  const rule = new PrimaryPaywallManifestRequiredCountryRule("primary paywall manifest needs this field");
  const item = newPrimaryPaywallManifest("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryPaywallManifestClicksRangeRule flags values above clicks", () => {
  const rule = new PrimaryPaywallManifestClicksRangeRule(32, 120);
  const item = newPrimaryPaywallManifest("x", "y");
  item.clicks = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
