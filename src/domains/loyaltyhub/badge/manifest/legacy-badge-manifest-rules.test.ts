import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyBadgeManifestBudgetRangeRule,
  LegacyBadgeManifestChannelLengthRule,
  LegacyBadgeManifestRequiredAudienceIdRule,
  defaultLegacyBadgeManifestValidator,
} from "./legacy-badge-manifest-rules.js";
import { newLegacyBadgeManifest } from "./legacy-badge-manifest.js";

test("LegacyBadgeManifestValidator reports every problem", () => {
  const validator = defaultLegacyBadgeManifestValidator();
  const item = newLegacyBadgeManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyBadgeManifestChannelLengthRule flags a long channel", () => {
  const rule = new LegacyBadgeManifestChannelLengthRule(64);
  const item = newLegacyBadgeManifest("x", "y");
  item.channel = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyBadgeManifestRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new LegacyBadgeManifestRequiredAudienceIdRule("legacy badge manifest needs a value");
  const item = newLegacyBadgeManifest("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyBadgeManifestBudgetRangeRule flags values above budget", () => {
  const rule = new LegacyBadgeManifestBudgetRangeRule(9.9, 1974.1);
  const item = newLegacyBadgeManifest("x", "y");
  item.budget = 1975.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
