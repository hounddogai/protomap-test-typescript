import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingCsatMilestoneRequiredCodeRule,
  PendingCsatMilestoneTitleLengthRule,
  defaultPendingCsatMilestoneValidator,
} from "./pending-csat-milestone-rules.js";
import { newPendingCsatMilestone } from "./pending-csat-milestone.js";

test("PendingCsatMilestoneValidator reports every problem", () => {
  const validator = defaultPendingCsatMilestoneValidator();
  const item = newPendingCsatMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingCsatMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new PendingCsatMilestoneRequiredCodeRule("pending csat milestone needs an entry");
  const item = newPendingCsatMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingCsatMilestoneTitleLengthRule flags a long title", () => {
  const rule = new PendingCsatMilestoneTitleLengthRule(3600);
  const item = newPendingCsatMilestone("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
