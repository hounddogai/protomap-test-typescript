import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackWaitSummaryRequiredTimezoneRule,
  defaultFallbackWaitSummaryValidator,
} from "./fallback-wait-summary-rules.js";
import { newFallbackWaitSummary } from "./fallback-wait-summary.js";

test("FallbackWaitSummaryValidator reports every problem", () => {
  const validator = defaultFallbackWaitSummaryValidator();
  const item = newFallbackWaitSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackWaitSummaryRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new FallbackWaitSummaryRequiredTimezoneRule("fallback wait summary needs a value");
  const item = newFallbackWaitSummary("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
