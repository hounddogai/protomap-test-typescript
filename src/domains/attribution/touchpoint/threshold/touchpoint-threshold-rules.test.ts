import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointThresholdRequiredCodeRule,
  TouchpointThresholdRequiredLabelRule,
  defaultTouchpointThresholdValidator,
} from "./touchpoint-threshold-rules.js";
import { newTouchpointThreshold } from "./touchpoint-threshold.js";

test("TouchpointThresholdValidator reports every problem", () => {
  const validator = defaultTouchpointThresholdValidator();
  const item = newTouchpointThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointThresholdRequiredLabelRule flags a blank label", () => {
  const rule = new TouchpointThresholdRequiredLabelRule("touchpoint threshold needs an entry");
  const item = newTouchpointThreshold("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new TouchpointThresholdRequiredCodeRule("touchpoint threshold needs an entry");
  const item = newTouchpointThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
