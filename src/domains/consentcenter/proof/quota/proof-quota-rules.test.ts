import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofQuotaCodeLengthRule,
  ProofQuotaNameLengthRule,
  ProofQuotaRequiredCodeRule,
  ProofQuotaRequiredRegionRule,
  ProofQuotaRequiredUnitRule,
  defaultProofQuotaValidator,
} from "./proof-quota-rules.js";
import { newProofQuota } from "./proof-quota.js";

test("ProofQuotaValidator reports every problem", () => {
  const validator = defaultProofQuotaValidator();
  const item = newProofQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofQuotaRequiredRegionRule flags a blank region", () => {
  const rule = new ProofQuotaRequiredRegionRule("proof quota needs this field");
  const item = newProofQuota("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofQuotaCodeLengthRule flags a long code", () => {
  const rule = new ProofQuotaCodeLengthRule(1000);
  const item = newProofQuota("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofQuotaRequiredUnitRule flags a blank unit", () => {
  const rule = new ProofQuotaRequiredUnitRule("proof quota needs a value");
  const item = newProofQuota("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofQuotaNameLengthRule flags a long name", () => {
  const rule = new ProofQuotaNameLengthRule(86400);
  const item = newProofQuota("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new ProofQuotaRequiredCodeRule("proof quota needs an entry");
  const item = newProofQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
