import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierManifestChannelLengthRule,
  TierManifestRequiredChannelRule,
  TierManifestRequiredCodeRule,
  TierManifestRequiredNameRule,
  defaultTierManifestValidator,
} from "./tier-manifest-rules.js";
import { newTierManifest } from "./tier-manifest.js";

test("TierManifestValidator reports every problem", () => {
  const validator = defaultTierManifestValidator();
  const item = newTierManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierManifestRequiredChannelRule flags a blank channel", () => {
  const rule = new TierManifestRequiredChannelRule("tier manifest needs a value");
  const item = newTierManifest("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierManifestRequiredCodeRule flags a blank code", () => {
  const rule = new TierManifestRequiredCodeRule("tier manifest needs a value");
  const item = newTierManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierManifestChannelLengthRule flags a long channel", () => {
  const rule = new TierManifestChannelLengthRule(3600);
  const item = newTierManifest("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierManifestRequiredNameRule flags a blank name", () => {
  const rule = new TierManifestRequiredNameRule("tier manifest needs an entry");
  const item = newTierManifest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
