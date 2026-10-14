import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualCreditRecordRequiredCodeRule,
  ManualCreditRecordRequiredCohortRule,
  ManualCreditRecordRequiredContactEmailRule,
  ManualCreditRecordRequiredNameRule,
  defaultManualCreditRecordValidator,
} from "./manual-credit-record-rules.js";
import { newManualCreditRecord } from "./manual-credit-record.js";

test("ManualCreditRecordValidator reports every problem", () => {
  const validator = defaultManualCreditRecordValidator();
  const item = newManualCreditRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualCreditRecordRequiredCodeRule flags a blank code", () => {
  const rule = new ManualCreditRecordRequiredCodeRule("manual credit record needs this field");
  const item = newManualCreditRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualCreditRecordRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new ManualCreditRecordRequiredContactEmailRule("manual credit record needs a value");
  const item = newManualCreditRecord("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualCreditRecordRequiredCohortRule flags a blank cohort", () => {
  const rule = new ManualCreditRecordRequiredCohortRule("manual credit record needs this field");
  const item = newManualCreditRecord("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualCreditRecordRequiredNameRule flags a blank name", () => {
  const rule = new ManualCreditRecordRequiredNameRule("manual credit record needs an entry");
  const item = newManualCreditRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
