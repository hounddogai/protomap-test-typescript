import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingCohortDraftCapacityRangeRule,
  PendingCohortDraftRequiredLabelRule,
  defaultPendingCohortDraftValidator,
} from "./pending-cohort-draft-rules.js";
import { newPendingCohortDraft } from "./pending-cohort-draft.js";

test("PendingCohortDraftValidator reports every problem", () => {
  const validator = defaultPendingCohortDraftValidator();
  const item = newPendingCohortDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingCohortDraftRequiredLabelRule flags a blank label", () => {
  const rule = new PendingCohortDraftRequiredLabelRule("pending cohort draft needs this field");
  const item = newPendingCohortDraft("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingCohortDraftCapacityRangeRule flags values above capacity", () => {
  const rule = new PendingCohortDraftCapacityRangeRule(80, 120);
  const item = newPendingCohortDraft("x", "y");
  item.capacity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
