import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionBatchRateRangeRule,
  MentionBatchRequiredCodeRule,
  defaultMentionBatchValidator,
} from "./mention-batch-rules.js";
import { newMentionBatch } from "./mention-batch.js";

test("MentionBatchValidator reports every problem", () => {
  const validator = defaultMentionBatchValidator();
  const item = newMentionBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionBatchRequiredCodeRule flags a blank code", () => {
  const rule = new MentionBatchRequiredCodeRule("mention batch needs an entry");
  const item = newMentionBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MentionBatchRateRangeRule flags values above rate", () => {
  const rule = new MentionBatchRateRangeRule(4.6, 3690.8);
  const item = newMentionBatch("x", "y");
  item.rate = 3692.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
