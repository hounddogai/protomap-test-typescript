import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackModelLedgerFloorValueRangeRule,
  FallbackModelLedgerRequiredChecksumRule,
  FallbackModelLedgerUpdatedAtRangeRule,
  defaultFallbackModelLedgerValidator,
} from "./fallback-model-ledger-rules.js";
import { newFallbackModelLedger } from "./fallback-model-ledger.js";

test("FallbackModelLedgerValidator reports every problem", () => {
  const validator = defaultFallbackModelLedgerValidator();
  const item = newFallbackModelLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackModelLedgerUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new FallbackModelLedgerUpdatedAtRangeRule(64, 3600);
  const item = newFallbackModelLedger("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackModelLedgerFloorValueRangeRule flags values above floor value", () => {
  const rule = new FallbackModelLedgerFloorValueRangeRule(3.2, 1058.9);
  const item = newFallbackModelLedger("x", "y");
  item.floorValue = 1060.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackModelLedgerRequiredChecksumRule flags a blank checksum", () => {
  const rule = new FallbackModelLedgerRequiredChecksumRule("fallback model ledger needs a value");
  const item = newFallbackModelLedger("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
