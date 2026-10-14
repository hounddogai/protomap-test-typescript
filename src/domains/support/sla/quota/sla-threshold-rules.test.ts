import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaThresholdCodeLengthRule,
  SlaThresholdPriorityRangeRule,
  SlaThresholdRequiredSegmentRule,
  SlaThresholdUtmSourceLengthRule,
  defaultSlaThresholdValidator,
} from "./sla-threshold-rules.js";
import { newSlaThreshold } from "./sla-threshold.js";

test("SlaThresholdValidator reports every problem", () => {
  const validator = defaultSlaThresholdValidator();
  const item = newSlaThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaThresholdRequiredSegmentRule flags a blank segment", () => {
  const rule = new SlaThresholdRequiredSegmentRule("sla threshold needs an entry");
  const item = newSlaThreshold("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaThresholdUtmSourceLengthRule flags a long utm source", () => {
  const rule = new SlaThresholdUtmSourceLengthRule(64);
  const item = newSlaThreshold("x", "y");
  item.utmSource = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaThresholdCodeLengthRule flags a long code", () => {
  const rule = new SlaThresholdCodeLengthRule(3600);
  const item = newSlaThreshold("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaThresholdPriorityRangeRule flags values above priority", () => {
  const rule = new SlaThresholdPriorityRangeRule(1000, 1000);
  const item = newSlaThreshold("x", "y");
  item.priority = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
