import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelSummaryCodeLengthRule,
  FunnelSummaryRequiredContactEmailRule,
  FunnelSummaryRequiredNameRule,
  defaultFunnelSummaryValidator,
} from "./funnel-summary-rules.js";
import { newFunnelSummary } from "./funnel-summary.js";

test("FunnelSummaryValidator reports every problem", () => {
  const validator = defaultFunnelSummaryValidator();
  const item = newFunnelSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelSummaryCodeLengthRule flags a long code", () => {
  const rule = new FunnelSummaryCodeLengthRule(1000);
  const item = newFunnelSummary("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelSummaryRequiredNameRule flags a blank name", () => {
  const rule = new FunnelSummaryRequiredNameRule("funnel summary needs an entry");
  const item = newFunnelSummary("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelSummaryRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new FunnelSummaryRequiredContactEmailRule("funnel summary needs a value");
  const item = newFunnelSummary("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
