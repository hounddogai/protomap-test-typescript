import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualTouchpointTargetClicksRangeRule,
  ManualTouchpointTargetPriorityRangeRule,
  ManualTouchpointTargetRequiredLabelRule,
  ManualTouchpointTargetSequenceRangeRule,
  defaultManualTouchpointTargetValidator,
} from "./manual-touchpoint-target-rules.js";
import { newManualTouchpointTarget } from "./manual-touchpoint-target.js";

test("ManualTouchpointTargetValidator reports every problem", () => {
  const validator = defaultManualTouchpointTargetValidator();
  const item = newManualTouchpointTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualTouchpointTargetClicksRangeRule flags values above clicks", () => {
  const rule = new ManualTouchpointTargetClicksRangeRule(16, 80);
  const item = newManualTouchpointTarget("x", "y");
  item.clicks = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualTouchpointTargetSequenceRangeRule flags values above sequence", () => {
  const rule = new ManualTouchpointTargetSequenceRangeRule(16, 120);
  const item = newManualTouchpointTarget("x", "y");
  item.sequence = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualTouchpointTargetRequiredLabelRule flags a blank label", () => {
  const rule = new ManualTouchpointTargetRequiredLabelRule("manual touchpoint target needs this field");
  const item = newManualTouchpointTarget("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualTouchpointTargetPriorityRangeRule flags values above priority", () => {
  const rule = new ManualTouchpointTargetPriorityRangeRule(80, 80);
  const item = newManualTouchpointTarget("x", "y");
  item.priority = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
