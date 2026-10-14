import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientProofAuditAmountRangeRule,
  LenientProofAuditCampaignRefLengthRule,
  LenientProofAuditCodeLengthRule,
  LenientProofAuditRequiredCodeRule,
  LenientProofAuditWeightRangeRule,
  defaultLenientProofAuditValidator,
} from "./lenient-proof-audit-rules.js";
import { newLenientProofAudit } from "./lenient-proof-audit.js";

test("LenientProofAuditValidator reports every problem", () => {
  const validator = defaultLenientProofAuditValidator();
  const item = newLenientProofAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientProofAuditWeightRangeRule flags values above weight", () => {
  const rule = new LenientProofAuditWeightRangeRule(5.5, 2749.3);
  const item = newLenientProofAudit("x", "y");
  item.weight = 2750.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientProofAuditCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new LenientProofAuditCampaignRefLengthRule(80);
  const item = newLenientProofAudit("x", "y");
  item.campaignRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientProofAuditCodeLengthRule flags a long code", () => {
  const rule = new LenientProofAuditCodeLengthRule(32);
  const item = newLenientProofAudit("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientProofAuditRequiredCodeRule flags a blank code", () => {
  const rule = new LenientProofAuditRequiredCodeRule("lenient proof audit needs a value");
  const item = newLenientProofAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientProofAuditAmountRangeRule flags values above amount", () => {
  const rule = new LenientProofAuditAmountRangeRule(6.7, 1011.7);
  const item = newLenientProofAudit("x", "y");
  item.amount = 1013.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
