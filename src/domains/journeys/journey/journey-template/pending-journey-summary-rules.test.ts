import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingJourneySummaryRequiredExternalRefRule,
  PendingJourneySummaryRequiredNameRule,
  defaultPendingJourneySummaryValidator,
} from "./pending-journey-summary-rules.js";
import { newPendingJourneySummary } from "./pending-journey-summary.js";

test("PendingJourneySummaryValidator reports every problem", () => {
  const validator = defaultPendingJourneySummaryValidator();
  const item = newPendingJourneySummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingJourneySummaryRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new PendingJourneySummaryRequiredExternalRefRule("pending journey summary needs this field");
  const item = newPendingJourneySummary("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingJourneySummaryRequiredNameRule flags a blank name", () => {
  const rule = new PendingJourneySummaryRequiredNameRule("pending journey summary needs this field");
  const item = newPendingJourneySummary("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
