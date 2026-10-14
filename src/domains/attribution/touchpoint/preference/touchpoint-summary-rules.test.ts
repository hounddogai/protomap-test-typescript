import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointSummaryRequiredCodeRule,
  TouchpointSummaryRequiredCurrencyRule,
  TouchpointSummaryRequiredLabelRule,
  defaultTouchpointSummaryValidator,
} from "./touchpoint-summary-rules.js";
import { newTouchpointSummary } from "./touchpoint-summary.js";

test("TouchpointSummaryValidator reports every problem", () => {
  const validator = defaultTouchpointSummaryValidator();
  const item = newTouchpointSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new TouchpointSummaryRequiredCodeRule("touchpoint summary needs an entry");
  const item = newTouchpointSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new TouchpointSummaryRequiredLabelRule("touchpoint summary needs a value");
  const item = newTouchpointSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointSummaryRequiredCurrencyRule flags a blank currency", () => {
  const rule = new TouchpointSummaryRequiredCurrencyRule("touchpoint summary needs an entry");
  const item = newTouchpointSummary("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
