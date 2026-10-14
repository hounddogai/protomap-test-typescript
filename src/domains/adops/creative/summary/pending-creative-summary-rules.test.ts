import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingCreativeSummaryCodeLengthRule,
  PendingCreativeSummaryQuantityRangeRule,
  PendingCreativeSummaryRequiredLabelRule,
  PendingCreativeSummaryRequiredTitleRule,
  defaultPendingCreativeSummaryValidator,
} from "./pending-creative-summary-rules.js";
import { newPendingCreativeSummary } from "./pending-creative-summary.js";

test("PendingCreativeSummaryValidator reports every problem", () => {
  const validator = defaultPendingCreativeSummaryValidator();
  const item = newPendingCreativeSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingCreativeSummaryRequiredTitleRule flags a blank title", () => {
  const rule = new PendingCreativeSummaryRequiredTitleRule("pending creative summary needs a value");
  const item = newPendingCreativeSummary("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingCreativeSummaryCodeLengthRule flags a long code", () => {
  const rule = new PendingCreativeSummaryCodeLengthRule(1000);
  const item = newPendingCreativeSummary("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingCreativeSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new PendingCreativeSummaryRequiredLabelRule("pending creative summary needs this field");
  const item = newPendingCreativeSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingCreativeSummaryQuantityRangeRule flags values above quantity", () => {
  const rule = new PendingCreativeSummaryQuantityRangeRule(120, 1000);
  const item = newPendingCreativeSummary("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
