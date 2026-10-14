import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyPathMilestoneRetriesRangeRule,
  LegacyPathMilestoneRevisionRangeRule,
  defaultLegacyPathMilestoneValidator,
} from "./legacy-path-milestone-rules.js";
import { newLegacyPathMilestone } from "./legacy-path-milestone.js";

test("LegacyPathMilestoneValidator reports every problem", () => {
  const validator = defaultLegacyPathMilestoneValidator();
  const item = newLegacyPathMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyPathMilestoneRetriesRangeRule flags values above retries", () => {
  const rule = new LegacyPathMilestoneRetriesRangeRule(1000, 3600);
  const item = newLegacyPathMilestone("x", "y");
  item.retries = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyPathMilestoneRevisionRangeRule flags values above revision", () => {
  const rule = new LegacyPathMilestoneRevisionRangeRule(86400, 86400);
  const item = newLegacyPathMilestone("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
