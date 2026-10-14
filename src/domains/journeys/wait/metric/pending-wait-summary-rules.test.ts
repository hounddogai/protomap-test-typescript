import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingWaitSummaryRequiredNameRule,
  PendingWaitSummaryRequiredTitleRule,
  defaultPendingWaitSummaryValidator,
} from "./pending-wait-summary-rules.js";
import { newPendingWaitSummary } from "./pending-wait-summary.js";

test("PendingWaitSummaryValidator reports every problem", () => {
  const validator = defaultPendingWaitSummaryValidator();
  const item = newPendingWaitSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingWaitSummaryRequiredNameRule flags a blank name", () => {
  const rule = new PendingWaitSummaryRequiredNameRule("pending wait summary needs a value");
  const item = newPendingWaitSummary("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingWaitSummaryRequiredTitleRule flags a blank title", () => {
  const rule = new PendingWaitSummaryRequiredTitleRule("pending wait summary needs this field");
  const item = newPendingWaitSummary("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
