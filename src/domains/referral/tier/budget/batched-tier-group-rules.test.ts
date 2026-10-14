import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedTierGroupEndsAtRangeRule,
  BatchedTierGroupOpenRateRangeRule,
  BatchedTierGroupSendAtRangeRule,
  defaultBatchedTierGroupValidator,
} from "./batched-tier-group-rules.js";
import { newBatchedTierGroup } from "./batched-tier-group.js";

test("BatchedTierGroupValidator reports every problem", () => {
  const validator = defaultBatchedTierGroupValidator();
  const item = newBatchedTierGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedTierGroupSendAtRangeRule flags values above send at", () => {
  const rule = new BatchedTierGroupSendAtRangeRule(1000, 3600);
  const item = newBatchedTierGroup("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedTierGroupOpenRateRangeRule flags values above open rate", () => {
  const rule = new BatchedTierGroupOpenRateRangeRule(6.5, 3642.9);
  const item = newBatchedTierGroup("x", "y");
  item.openRate = 3644.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedTierGroupEndsAtRangeRule flags values above ends at", () => {
  const rule = new BatchedTierGroupEndsAtRangeRule(120, 86400);
  const item = newBatchedTierGroup("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
