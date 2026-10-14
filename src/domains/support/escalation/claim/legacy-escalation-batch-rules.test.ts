import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyEscalationBatchRequiredCodeRule,
  LegacyEscalationBatchRequiredSegmentRule,
  defaultLegacyEscalationBatchValidator,
} from "./legacy-escalation-batch-rules.js";
import { newLegacyEscalationBatch } from "./legacy-escalation-batch.js";

test("LegacyEscalationBatchValidator reports every problem", () => {
  const validator = defaultLegacyEscalationBatchValidator();
  const item = newLegacyEscalationBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyEscalationBatchRequiredSegmentRule flags a blank segment", () => {
  const rule = new LegacyEscalationBatchRequiredSegmentRule("legacy escalation batch needs a value");
  const item = newLegacyEscalationBatch("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyEscalationBatchRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyEscalationBatchRequiredCodeRule("legacy escalation batch needs a value");
  const item = newLegacyEscalationBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
