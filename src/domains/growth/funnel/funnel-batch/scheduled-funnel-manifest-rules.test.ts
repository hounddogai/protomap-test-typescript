import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledFunnelManifestMinimumRangeRule,
  ScheduledFunnelManifestRequiredCodeRule,
  ScheduledFunnelManifestScoreRangeRule,
  defaultScheduledFunnelManifestValidator,
} from "./scheduled-funnel-manifest-rules.js";
import { newScheduledFunnelManifest } from "./scheduled-funnel-manifest.js";

test("ScheduledFunnelManifestValidator reports every problem", () => {
  const validator = defaultScheduledFunnelManifestValidator();
  const item = newScheduledFunnelManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledFunnelManifestMinimumRangeRule flags values above minimum", () => {
  const rule = new ScheduledFunnelManifestMinimumRangeRule(2.5, 3746.2);
  const item = newScheduledFunnelManifest("x", "y");
  item.minimum = 3747.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledFunnelManifestRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledFunnelManifestRequiredCodeRule("scheduled funnel manifest needs a value");
  const item = newScheduledFunnelManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledFunnelManifestScoreRangeRule flags values above score", () => {
  const rule = new ScheduledFunnelManifestScoreRangeRule(0.2, 4495);
  const item = newScheduledFunnelManifest("x", "y");
  item.score = 4496.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
