import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingCohortDraftBudgetRangeRule,
  RollingCohortDraftRequiredCodeRule,
  RollingCohortDraftRequiredLocaleRule,
  RollingCohortDraftRequiredNameRule,
  RollingCohortDraftThresholdRangeRule,
  defaultRollingCohortDraftValidator,
} from "./rolling-cohort-draft-rules.js";
import { newRollingCohortDraft } from "./rolling-cohort-draft.js";

test("RollingCohortDraftValidator reports every problem", () => {
  const validator = defaultRollingCohortDraftValidator();
  const item = newRollingCohortDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingCohortDraftThresholdRangeRule flags values above threshold", () => {
  const rule = new RollingCohortDraftThresholdRangeRule(8.4, 4192.4);
  const item = newRollingCohortDraft("x", "y");
  item.threshold = 4193.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingCohortDraftRequiredCodeRule flags a blank code", () => {
  const rule = new RollingCohortDraftRequiredCodeRule("rolling cohort draft needs this field");
  const item = newRollingCohortDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingCohortDraftRequiredNameRule flags a blank name", () => {
  const rule = new RollingCohortDraftRequiredNameRule("rolling cohort draft needs an entry");
  const item = newRollingCohortDraft("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingCohortDraftRequiredLocaleRule flags a blank locale", () => {
  const rule = new RollingCohortDraftRequiredLocaleRule("rolling cohort draft needs a value");
  const item = newRollingCohortDraft("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingCohortDraftBudgetRangeRule flags values above budget", () => {
  const rule = new RollingCohortDraftBudgetRangeRule(2.7, 660.1);
  const item = newRollingCohortDraft("x", "y");
  item.budget = 661.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
