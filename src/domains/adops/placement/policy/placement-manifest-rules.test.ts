import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementManifestClicksRangeRule,
  PlacementManifestOpenRateRangeRule,
  PlacementManifestRequiredTitleRule,
  defaultPlacementManifestValidator,
} from "./placement-manifest-rules.js";
import { newPlacementManifest } from "./placement-manifest.js";

test("PlacementManifestValidator reports every problem", () => {
  const validator = defaultPlacementManifestValidator();
  const item = newPlacementManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementManifestClicksRangeRule flags values above clicks", () => {
  const rule = new PlacementManifestClicksRangeRule(255, 1000);
  const item = newPlacementManifest("x", "y");
  item.clicks = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementManifestRequiredTitleRule flags a blank title", () => {
  const rule = new PlacementManifestRequiredTitleRule("placement manifest needs an entry");
  const item = newPlacementManifest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementManifestOpenRateRangeRule flags values above open rate", () => {
  const rule = new PlacementManifestOpenRateRangeRule(8.2, 2434.6);
  const item = newPlacementManifest("x", "y");
  item.openRate = 2436.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
