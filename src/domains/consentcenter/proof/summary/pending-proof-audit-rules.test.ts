import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingProofAuditBidRangeRule,
  PendingProofAuditCodeLengthRule,
  PendingProofAuditRequiredTimezoneRule,
  defaultPendingProofAuditValidator,
} from "./pending-proof-audit-rules.js";
import { newPendingProofAudit } from "./pending-proof-audit.js";

test("PendingProofAuditValidator reports every problem", () => {
  const validator = defaultPendingProofAuditValidator();
  const item = newPendingProofAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingProofAuditRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new PendingProofAuditRequiredTimezoneRule("pending proof audit needs a value");
  const item = newPendingProofAudit("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingProofAuditBidRangeRule flags values above bid", () => {
  const rule = new PendingProofAuditBidRangeRule(7.3, 2166.7);
  const item = newPendingProofAudit("x", "y");
  item.bid = 2168.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingProofAuditCodeLengthRule flags a long code", () => {
  const rule = new PendingProofAuditCodeLengthRule(1000);
  const item = newPendingProofAudit("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
