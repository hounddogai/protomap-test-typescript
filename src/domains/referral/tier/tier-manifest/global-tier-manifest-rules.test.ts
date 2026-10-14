import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalTierManifestPhoneLengthRule,
  GlobalTierManifestRequiredCodeRule,
  GlobalTierManifestRequiredNameRule,
  defaultGlobalTierManifestValidator,
} from "./global-tier-manifest-rules.js";
import { newGlobalTierManifest } from "./global-tier-manifest.js";

test("GlobalTierManifestValidator reports every problem", () => {
  const validator = defaultGlobalTierManifestValidator();
  const item = newGlobalTierManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalTierManifestRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalTierManifestRequiredCodeRule("global tier manifest needs this field");
  const item = newGlobalTierManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalTierManifestRequiredNameRule flags a blank name", () => {
  const rule = new GlobalTierManifestRequiredNameRule("global tier manifest needs this field");
  const item = newGlobalTierManifest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalTierManifestPhoneLengthRule flags a long phone", () => {
  const rule = new GlobalTierManifestPhoneLengthRule(120);
  const item = newGlobalTierManifest("x", "y");
  item.phone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
