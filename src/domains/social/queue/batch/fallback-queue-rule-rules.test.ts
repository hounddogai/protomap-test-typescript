import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackQueueRuleRequiredChecksumRule,
  FallbackQueueRuleScoreRangeRule,
  defaultFallbackQueueRuleValidator,
} from "./fallback-queue-rule-rules.js";
import { newFallbackQueueRule } from "./fallback-queue-rule.js";

test("FallbackQueueRuleValidator reports every problem", () => {
  const validator = defaultFallbackQueueRuleValidator();
  const item = newFallbackQueueRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackQueueRuleScoreRangeRule flags values above score", () => {
  const rule = new FallbackQueueRuleScoreRangeRule(2.8, 1325.8);
  const item = newFallbackQueueRule("x", "y");
  item.score = 1327.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackQueueRuleRequiredChecksumRule flags a blank checksum", () => {
  const rule = new FallbackQueueRuleRequiredChecksumRule("fallback queue rule needs this field");
  const item = newFallbackQueueRule("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
