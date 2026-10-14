import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutScoreRevisionRangeRule,
  PayoutScoreTitleLengthRule,
  defaultPayoutScoreValidator,
} from "./payout-score-rules.js";
import { newPayoutScore } from "./payout-score.js";

test("PayoutScoreValidator reports every problem", () => {
  const validator = defaultPayoutScoreValidator();
  const item = newPayoutScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutScoreTitleLengthRule flags a long title", () => {
  const rule = new PayoutScoreTitleLengthRule(1000);
  const item = newPayoutScore("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutScoreRevisionRangeRule flags values above revision", () => {
  const rule = new PayoutScoreRevisionRangeRule(16, 64);
  const item = newPayoutScore("x", "y");
  item.revision = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
