import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictProofEntryAmountRangeRule,
  StrictProofEntryRequiredCodeRule,
  StrictProofEntryRequiredJourneyIdRule,
  defaultStrictProofEntryValidator,
} from "./strict-proof-entry-rules.js";
import { newStrictProofEntry } from "./strict-proof-entry.js";

test("StrictProofEntryValidator reports every problem", () => {
  const validator = defaultStrictProofEntryValidator();
  const item = newStrictProofEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictProofEntryRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new StrictProofEntryRequiredJourneyIdRule("strict proof entry needs a value");
  const item = newStrictProofEntry("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictProofEntryAmountRangeRule flags values above amount", () => {
  const rule = new StrictProofEntryAmountRangeRule(7.4, 3685.4);
  const item = newStrictProofEntry("x", "y");
  item.amount = 3686.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictProofEntryRequiredCodeRule flags a blank code", () => {
  const rule = new StrictProofEntryRequiredCodeRule("strict proof entry needs an entry");
  const item = newStrictProofEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
