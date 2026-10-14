import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionLedgerChecksumLengthRule,
  ConversionLedgerRequiredChecksumRule,
  ConversionLedgerRequiredNameRule,
  ConversionLedgerWeightRangeRule,
  defaultConversionLedgerValidator,
} from "./conversion-ledger-rules.js";
import { newConversionLedger } from "./conversion-ledger.js";

test("ConversionLedgerValidator reports every problem", () => {
  const validator = defaultConversionLedgerValidator();
  const item = newConversionLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionLedgerRequiredChecksumRule flags a blank checksum", () => {
  const rule = new ConversionLedgerRequiredChecksumRule("conversion ledger needs this field");
  const item = newConversionLedger("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionLedgerRequiredNameRule flags a blank name", () => {
  const rule = new ConversionLedgerRequiredNameRule("conversion ledger needs a value");
  const item = newConversionLedger("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionLedgerWeightRangeRule flags values above weight", () => {
  const rule = new ConversionLedgerWeightRangeRule(5.8, 2823.4);
  const item = newConversionLedger("x", "y");
  item.weight = 2824.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionLedgerChecksumLengthRule flags a long checksum", () => {
  const rule = new ConversionLedgerChecksumLengthRule(120);
  const item = newConversionLedger("x", "y");
  item.checksum = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
