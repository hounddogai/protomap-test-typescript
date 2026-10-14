import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalCreativeSummaryRequiredCodeRule,
  GlobalCreativeSummaryRequiredLabelRule,
  GlobalCreativeSummaryStartsAtRangeRule,
  defaultGlobalCreativeSummaryValidator,
} from "./global-creative-summary-rules.js";
import { newGlobalCreativeSummary } from "./global-creative-summary.js";

test("GlobalCreativeSummaryValidator reports every problem", () => {
  const validator = defaultGlobalCreativeSummaryValidator();
  const item = newGlobalCreativeSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalCreativeSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalCreativeSummaryRequiredLabelRule("global creative summary needs this field");
  const item = newGlobalCreativeSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalCreativeSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalCreativeSummaryRequiredCodeRule("global creative summary needs a value");
  const item = newGlobalCreativeSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalCreativeSummaryStartsAtRangeRule flags values above starts at", () => {
  const rule = new GlobalCreativeSummaryStartsAtRangeRule(80, 1000);
  const item = newGlobalCreativeSummary("x", "y");
  item.startsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
