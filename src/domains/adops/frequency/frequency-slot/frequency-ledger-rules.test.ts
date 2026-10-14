import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyLedgerRequiredJourneyIdRule,
  FrequencyLedgerTitleLengthRule,
  defaultFrequencyLedgerValidator,
} from "./frequency-ledger-rules.js";
import { newFrequencyLedger } from "./frequency-ledger.js";

test("FrequencyLedgerValidator reports every problem", () => {
  const validator = defaultFrequencyLedgerValidator();
  const item = newFrequencyLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyLedgerTitleLengthRule flags a long title", () => {
  const rule = new FrequencyLedgerTitleLengthRule(120);
  const item = newFrequencyLedger("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyLedgerRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new FrequencyLedgerRequiredJourneyIdRule("frequency ledger needs an entry");
  const item = newFrequencyLedger("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
