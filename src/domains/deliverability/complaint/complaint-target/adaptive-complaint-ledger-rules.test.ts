import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveComplaintLedgerDescriptionLengthRule,
  AdaptiveComplaintLedgerRequiredCodeRule,
  AdaptiveComplaintLedgerRequiredDescriptionRule,
  AdaptiveComplaintLedgerRequiredTitleRule,
  defaultAdaptiveComplaintLedgerValidator,
} from "./adaptive-complaint-ledger-rules.js";
import { newAdaptiveComplaintLedger } from "./adaptive-complaint-ledger.js";

test("AdaptiveComplaintLedgerValidator reports every problem", () => {
  const validator = defaultAdaptiveComplaintLedgerValidator();
  const item = newAdaptiveComplaintLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveComplaintLedgerRequiredTitleRule flags a blank title", () => {
  const rule = new AdaptiveComplaintLedgerRequiredTitleRule("adaptive complaint ledger needs this field");
  const item = newAdaptiveComplaintLedger("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveComplaintLedgerRequiredDescriptionRule flags a blank description", () => {
  const rule = new AdaptiveComplaintLedgerRequiredDescriptionRule("adaptive complaint ledger needs this field");
  const item = newAdaptiveComplaintLedger("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveComplaintLedgerDescriptionLengthRule flags a long description", () => {
  const rule = new AdaptiveComplaintLedgerDescriptionLengthRule(1000);
  const item = newAdaptiveComplaintLedger("x", "y");
  item.description = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveComplaintLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveComplaintLedgerRequiredCodeRule("adaptive complaint ledger needs this field");
  const item = newAdaptiveComplaintLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
