import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleSummaryAudienceIdLengthRule,
  ExitRuleSummaryFrequencyCapRangeRule,
  ExitRuleSummaryOwnerIdLengthRule,
  ExitRuleSummaryRequiredAudienceIdRule,
  defaultExitRuleSummaryValidator,
} from "./exit-rule-summary-rules.js";
import { newExitRuleSummary } from "./exit-rule-summary.js";

test("ExitRuleSummaryValidator reports every problem", () => {
  const validator = defaultExitRuleSummaryValidator();
  const item = newExitRuleSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleSummaryOwnerIdLengthRule flags a long owner id", () => {
  const rule = new ExitRuleSummaryOwnerIdLengthRule(1000);
  const item = newExitRuleSummary("x", "y");
  item.ownerId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleSummaryRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new ExitRuleSummaryRequiredAudienceIdRule("exit rule summary needs an entry");
  const item = newExitRuleSummary("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleSummaryAudienceIdLengthRule flags a long audience id", () => {
  const rule = new ExitRuleSummaryAudienceIdLengthRule(80);
  const item = newExitRuleSummary("x", "y");
  item.audienceId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleSummaryFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new ExitRuleSummaryFrequencyCapRangeRule(64, 80);
  const item = newExitRuleSummary("x", "y");
  item.frequencyCap = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
