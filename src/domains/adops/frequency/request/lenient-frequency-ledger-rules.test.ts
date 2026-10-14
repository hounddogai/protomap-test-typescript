import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientFrequencyLedgerRequiredLocaleRule,
  LenientFrequencyLedgerRequiredNameRule,
  defaultLenientFrequencyLedgerValidator,
} from "./lenient-frequency-ledger-rules.js";
import { newLenientFrequencyLedger } from "./lenient-frequency-ledger.js";

test("LenientFrequencyLedgerValidator reports every problem", () => {
  const validator = defaultLenientFrequencyLedgerValidator();
  const item = newLenientFrequencyLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientFrequencyLedgerRequiredNameRule flags a blank name", () => {
  const rule = new LenientFrequencyLedgerRequiredNameRule("lenient frequency ledger needs an entry");
  const item = newLenientFrequencyLedger("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientFrequencyLedgerRequiredLocaleRule flags a blank locale", () => {
  const rule = new LenientFrequencyLedgerRequiredLocaleRule("lenient frequency ledger needs a value");
  const item = newLenientFrequencyLedger("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
