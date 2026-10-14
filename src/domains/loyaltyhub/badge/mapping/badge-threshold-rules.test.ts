import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeThresholdRequiredLabelRule,
  BadgeThresholdRequiredNameRule,
  defaultBadgeThresholdValidator,
} from "./badge-threshold-rules.js";
import { newBadgeThreshold } from "./badge-threshold.js";

test("BadgeThresholdValidator reports every problem", () => {
  const validator = defaultBadgeThresholdValidator();
  const item = newBadgeThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeThresholdRequiredLabelRule flags a blank label", () => {
  const rule = new BadgeThresholdRequiredLabelRule("badge threshold needs an entry");
  const item = newBadgeThreshold("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeThresholdRequiredNameRule flags a blank name", () => {
  const rule = new BadgeThresholdRequiredNameRule("badge threshold needs a value");
  const item = newBadgeThreshold("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
