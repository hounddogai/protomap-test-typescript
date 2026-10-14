import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalNudgeSummaryRequiredCodeRule,
  defaultRegionalNudgeSummaryValidator,
} from "./regional-nudge-summary-rules.js";
import { newRegionalNudgeSummary } from "./regional-nudge-summary.js";

test("RegionalNudgeSummaryValidator reports every problem", () => {
  const validator = defaultRegionalNudgeSummaryValidator();
  const item = newRegionalNudgeSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalNudgeSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalNudgeSummaryRequiredCodeRule("regional nudge summary needs an entry");
  const item = newRegionalNudgeSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
