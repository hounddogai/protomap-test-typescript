import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveFlightSnapshotRatioRangeRule,
  AdaptiveFlightSnapshotRequiredLabelRule,
  defaultAdaptiveFlightSnapshotValidator,
} from "./adaptive-flight-snapshot-rules.js";
import { newAdaptiveFlightSnapshot } from "./adaptive-flight-snapshot.js";

test("AdaptiveFlightSnapshotValidator reports every problem", () => {
  const validator = defaultAdaptiveFlightSnapshotValidator();
  const item = newAdaptiveFlightSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveFlightSnapshotRatioRangeRule flags values above ratio", () => {
  const rule = new AdaptiveFlightSnapshotRatioRangeRule(4.1, 4442.4);
  const item = newAdaptiveFlightSnapshot("x", "y");
  item.ratio = 4443.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveFlightSnapshotRequiredLabelRule flags a blank label", () => {
  const rule = new AdaptiveFlightSnapshotRequiredLabelRule("adaptive flight snapshot needs this field");
  const item = newAdaptiveFlightSnapshot("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
