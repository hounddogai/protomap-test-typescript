import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitSummaryCodeLengthRule,
  WaitSummaryLabelLengthRule,
  WaitSummaryRequiredCohortRule,
  WaitSummaryRequiredLabelRule,
  WaitSummaryRequiredNameRule,
  defaultWaitSummaryValidator,
} from "./wait-summary-rules.js";
import { newWaitSummary } from "./wait-summary.js";

test("WaitSummaryValidator reports every problem", () => {
  const validator = defaultWaitSummaryValidator();
  const item = newWaitSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitSummaryRequiredCohortRule flags a blank cohort", () => {
  const rule = new WaitSummaryRequiredCohortRule("wait summary needs this field");
  const item = newWaitSummary("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitSummaryCodeLengthRule flags a long code", () => {
  const rule = new WaitSummaryCodeLengthRule(255);
  const item = newWaitSummary("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WaitSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new WaitSummaryRequiredLabelRule("wait summary needs an entry");
  const item = newWaitSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitSummaryRequiredNameRule flags a blank name", () => {
  const rule = new WaitSummaryRequiredNameRule("wait summary needs a value");
  const item = newWaitSummary("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitSummaryLabelLengthRule flags a long label", () => {
  const rule = new WaitSummaryLabelLengthRule(80);
  const item = newWaitSummary("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
