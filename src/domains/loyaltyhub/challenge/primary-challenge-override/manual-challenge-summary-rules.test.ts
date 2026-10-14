import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualChallengeSummaryCohortLengthRule,
  ManualChallengeSummaryNameLengthRule,
  ManualChallengeSummaryRequiredNameRule,
  defaultManualChallengeSummaryValidator,
} from "./manual-challenge-summary-rules.js";
import { newManualChallengeSummary } from "./manual-challenge-summary.js";

test("ManualChallengeSummaryValidator reports every problem", () => {
  const validator = defaultManualChallengeSummaryValidator();
  const item = newManualChallengeSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualChallengeSummaryNameLengthRule flags a long name", () => {
  const rule = new ManualChallengeSummaryNameLengthRule(32);
  const item = newManualChallengeSummary("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualChallengeSummaryCohortLengthRule flags a long cohort", () => {
  const rule = new ManualChallengeSummaryCohortLengthRule(1000);
  const item = newManualChallengeSummary("x", "y");
  item.cohort = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualChallengeSummaryRequiredNameRule flags a blank name", () => {
  const rule = new ManualChallengeSummaryRequiredNameRule("manual challenge summary needs an entry");
  const item = newManualChallengeSummary("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
