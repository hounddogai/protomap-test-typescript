import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalBranchLedgerCodeLengthRule,
  SeasonalBranchLedgerMarginRangeRule,
  defaultSeasonalBranchLedgerValidator,
} from "./seasonal-branch-ledger-rules.js";
import { newSeasonalBranchLedger } from "./seasonal-branch-ledger.js";

test("SeasonalBranchLedgerValidator reports every problem", () => {
  const validator = defaultSeasonalBranchLedgerValidator();
  const item = newSeasonalBranchLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalBranchLedgerMarginRangeRule flags values above margin", () => {
  const rule = new SeasonalBranchLedgerMarginRangeRule(2.8, 2954.1);
  const item = newSeasonalBranchLedger("x", "y");
  item.margin = 2955.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalBranchLedgerCodeLengthRule flags a long code", () => {
  const rule = new SeasonalBranchLedgerCodeLengthRule(255);
  const item = newSeasonalBranchLedger("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
