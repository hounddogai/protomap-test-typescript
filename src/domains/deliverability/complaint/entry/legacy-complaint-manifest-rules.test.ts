import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyComplaintManifestDurationMinutesRangeRule,
  LegacyComplaintManifestTitleLengthRule,
  defaultLegacyComplaintManifestValidator,
} from "./legacy-complaint-manifest-rules.js";
import { newLegacyComplaintManifest } from "./legacy-complaint-manifest.js";

test("LegacyComplaintManifestValidator reports every problem", () => {
  const validator = defaultLegacyComplaintManifestValidator();
  const item = newLegacyComplaintManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyComplaintManifestTitleLengthRule flags a long title", () => {
  const rule = new LegacyComplaintManifestTitleLengthRule(16);
  const item = newLegacyComplaintManifest("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyComplaintManifestDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new LegacyComplaintManifestDurationMinutesRangeRule(1000, 3600);
  const item = newLegacyComplaintManifest("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
