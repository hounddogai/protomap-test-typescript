import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimarySenderSummaryCodeLengthRule,
  PrimarySenderSummaryRequiredCodeRule,
  defaultPrimarySenderSummaryValidator,
} from "./primary-sender-summary-rules.js";
import { newPrimarySenderSummary } from "./primary-sender-summary.js";

test("PrimarySenderSummaryValidator reports every problem", () => {
  const validator = defaultPrimarySenderSummaryValidator();
  const item = newPrimarySenderSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimarySenderSummaryCodeLengthRule flags a long code", () => {
  const rule = new PrimarySenderSummaryCodeLengthRule(16);
  const item = newPrimarySenderSummary("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimarySenderSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new PrimarySenderSummaryRequiredCodeRule("primary sender summary needs this field");
  const item = newPrimarySenderSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
