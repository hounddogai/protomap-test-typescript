import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualBadgeAdjustmentRequiredCohortRule,
  ManualBadgeAdjustmentRequiredTitleRule,
  defaultManualBadgeAdjustmentValidator,
} from "./manual-badge-adjustment-rules.js";
import { newManualBadgeAdjustment } from "./manual-badge-adjustment.js";

test("ManualBadgeAdjustmentValidator reports every problem", () => {
  const validator = defaultManualBadgeAdjustmentValidator();
  const item = newManualBadgeAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualBadgeAdjustmentRequiredCohortRule flags a blank cohort", () => {
  const rule = new ManualBadgeAdjustmentRequiredCohortRule("manual badge adjustment needs this field");
  const item = newManualBadgeAdjustment("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualBadgeAdjustmentRequiredTitleRule flags a blank title", () => {
  const rule = new ManualBadgeAdjustmentRequiredTitleRule("manual badge adjustment needs this field");
  const item = newManualBadgeAdjustment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
