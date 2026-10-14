import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacySenderMilestoneCodeLengthRule,
  LegacySenderMilestoneCohortLengthRule,
  LegacySenderMilestoneMarginRangeRule,
  LegacySenderMilestoneRequiredCohortRule,
  defaultLegacySenderMilestoneValidator,
} from "./legacy-sender-milestone-rules.js";
import { newLegacySenderMilestone } from "./legacy-sender-milestone.js";

test("LegacySenderMilestoneValidator reports every problem", () => {
  const validator = defaultLegacySenderMilestoneValidator();
  const item = newLegacySenderMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacySenderMilestoneMarginRangeRule flags values above margin", () => {
  const rule = new LegacySenderMilestoneMarginRangeRule(7.8, 4176.9);
  const item = newLegacySenderMilestone("x", "y");
  item.margin = 4178.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacySenderMilestoneCodeLengthRule flags a long code", () => {
  const rule = new LegacySenderMilestoneCodeLengthRule(1000);
  const item = newLegacySenderMilestone("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacySenderMilestoneCohortLengthRule flags a long cohort", () => {
  const rule = new LegacySenderMilestoneCohortLengthRule(80);
  const item = newLegacySenderMilestone("x", "y");
  item.cohort = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacySenderMilestoneRequiredCohortRule flags a blank cohort", () => {
  const rule = new LegacySenderMilestoneRequiredCohortRule("legacy sender milestone needs a value");
  const item = newLegacySenderMilestone("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
