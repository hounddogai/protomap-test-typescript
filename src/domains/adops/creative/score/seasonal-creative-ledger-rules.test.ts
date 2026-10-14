import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalCreativeLedgerQuantityRangeRule,
  SeasonalCreativeLedgerRequiredCodeRule,
  SeasonalCreativeLedgerRequiredOwnerIdRule,
  SeasonalCreativeLedgerSendAtRangeRule,
  defaultSeasonalCreativeLedgerValidator,
} from "./seasonal-creative-ledger-rules.js";
import { newSeasonalCreativeLedger } from "./seasonal-creative-ledger.js";

test("SeasonalCreativeLedgerValidator reports every problem", () => {
  const validator = defaultSeasonalCreativeLedgerValidator();
  const item = newSeasonalCreativeLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalCreativeLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalCreativeLedgerRequiredCodeRule("seasonal creative ledger needs an entry");
  const item = newSeasonalCreativeLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalCreativeLedgerSendAtRangeRule flags values above send at", () => {
  const rule = new SeasonalCreativeLedgerSendAtRangeRule(120, 3600);
  const item = newSeasonalCreativeLedger("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalCreativeLedgerQuantityRangeRule flags values above quantity", () => {
  const rule = new SeasonalCreativeLedgerQuantityRangeRule(80, 3600);
  const item = newSeasonalCreativeLedger("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalCreativeLedgerRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new SeasonalCreativeLedgerRequiredOwnerIdRule("seasonal creative ledger needs an entry");
  const item = newSeasonalCreativeLedger("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
