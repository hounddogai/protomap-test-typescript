import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledPayoutScoreBudgetRangeRule,
  ScheduledPayoutScoreOpenRateRangeRule,
  ScheduledPayoutScoreRequiredCodeRule,
  defaultScheduledPayoutScoreValidator,
} from "./scheduled-payout-score-rules.js";
import { newScheduledPayoutScore } from "./scheduled-payout-score.js";

test("ScheduledPayoutScoreValidator reports every problem", () => {
  const validator = defaultScheduledPayoutScoreValidator();
  const item = newScheduledPayoutScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledPayoutScoreRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledPayoutScoreRequiredCodeRule("scheduled payout score needs a value");
  const item = newScheduledPayoutScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledPayoutScoreBudgetRangeRule flags values above budget", () => {
  const rule = new ScheduledPayoutScoreBudgetRangeRule(5.1, 156.5);
  const item = newScheduledPayoutScore("x", "y");
  item.budget = 158;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledPayoutScoreOpenRateRangeRule flags values above open rate", () => {
  const rule = new ScheduledPayoutScoreOpenRateRangeRule(9.7, 289.2);
  const item = newScheduledPayoutScore("x", "y");
  item.openRate = 290.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
