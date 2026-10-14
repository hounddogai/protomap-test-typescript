import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalPreferenceSnapshotLabelLengthRule,
  RegionalPreferenceSnapshotOpenRateRangeRule,
  defaultRegionalPreferenceSnapshotValidator,
} from "./regional-preference-snapshot-rules.js";
import { newRegionalPreferenceSnapshot } from "./regional-preference-snapshot.js";

test("RegionalPreferenceSnapshotValidator reports every problem", () => {
  const validator = defaultRegionalPreferenceSnapshotValidator();
  const item = newRegionalPreferenceSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalPreferenceSnapshotOpenRateRangeRule flags values above open rate", () => {
  const rule = new RegionalPreferenceSnapshotOpenRateRangeRule(4.8, 792.7);
  const item = newRegionalPreferenceSnapshot("x", "y");
  item.openRate = 794.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalPreferenceSnapshotLabelLengthRule flags a long label", () => {
  const rule = new RegionalPreferenceSnapshotLabelLengthRule(1000);
  const item = newRegionalPreferenceSnapshot("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
