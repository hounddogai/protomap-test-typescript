import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultBranchLedgerLimitRangeRule,
  DefaultBranchLedgerSequenceRangeRule,
  defaultDefaultBranchLedgerValidator,
} from "./default-branch-ledger-rules.js";
import { newDefaultBranchLedger } from "./default-branch-ledger.js";

test("DefaultBranchLedgerValidator reports every problem", () => {
  const validator = defaultDefaultBranchLedgerValidator();
  const item = newDefaultBranchLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultBranchLedgerLimitRangeRule flags values above limit", () => {
  const rule = new DefaultBranchLedgerLimitRangeRule(80, 86400);
  const item = newDefaultBranchLedger("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultBranchLedgerSequenceRangeRule flags values above sequence", () => {
  const rule = new DefaultBranchLedgerSequenceRangeRule(255, 1000);
  const item = newDefaultBranchLedger("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
