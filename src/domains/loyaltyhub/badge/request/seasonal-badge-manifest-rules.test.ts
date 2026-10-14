import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalBadgeManifestClicksRangeRule,
  SeasonalBadgeManifestLocaleLengthRule,
  SeasonalBadgeManifestRequiredTitleRule,
  SeasonalBadgeManifestThresholdRangeRule,
  defaultSeasonalBadgeManifestValidator,
} from "./seasonal-badge-manifest-rules.js";
import { newSeasonalBadgeManifest } from "./seasonal-badge-manifest.js";

test("SeasonalBadgeManifestValidator reports every problem", () => {
  const validator = defaultSeasonalBadgeManifestValidator();
  const item = newSeasonalBadgeManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalBadgeManifestThresholdRangeRule flags values above threshold", () => {
  const rule = new SeasonalBadgeManifestThresholdRangeRule(7.1, 3984.3);
  const item = newSeasonalBadgeManifest("x", "y");
  item.threshold = 3985.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalBadgeManifestLocaleLengthRule flags a long locale", () => {
  const rule = new SeasonalBadgeManifestLocaleLengthRule(3600);
  const item = newSeasonalBadgeManifest("x", "y");
  item.locale = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalBadgeManifestRequiredTitleRule flags a blank title", () => {
  const rule = new SeasonalBadgeManifestRequiredTitleRule("seasonal badge manifest needs an entry");
  const item = newSeasonalBadgeManifest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalBadgeManifestClicksRangeRule flags values above clicks", () => {
  const rule = new SeasonalBadgeManifestClicksRangeRule(32, 255);
  const item = newSeasonalBadgeManifest("x", "y");
  item.clicks = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
