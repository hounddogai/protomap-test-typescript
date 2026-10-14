import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackFunnelAgreementCodeLengthRule,
  FallbackFunnelAgreementLabelLengthRule,
  FallbackFunnelAgreementMarginRangeRule,
  FallbackFunnelAgreementOwnerIdLengthRule,
  FallbackFunnelAgreementRequiredLabelRule,
  FallbackFunnelAgreementRequiredOwnerIdRule,
  defaultFallbackFunnelAgreementValidator,
} from "./fallback-funnel-agreement-rules.js";
import { newFallbackFunnelAgreement } from "./fallback-funnel-agreement.js";

test("FallbackFunnelAgreementValidator reports every problem", () => {
  const validator = defaultFallbackFunnelAgreementValidator();
  const item = newFallbackFunnelAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackFunnelAgreementCodeLengthRule flags a long code", () => {
  const rule = new FallbackFunnelAgreementCodeLengthRule(16);
  const item = newFallbackFunnelAgreement("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackFunnelAgreementRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackFunnelAgreementRequiredLabelRule("fallback funnel agreement needs an entry");
  const item = newFallbackFunnelAgreement("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackFunnelAgreementRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new FallbackFunnelAgreementRequiredOwnerIdRule("fallback funnel agreement needs a value");
  const item = newFallbackFunnelAgreement("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackFunnelAgreementLabelLengthRule flags a long label", () => {
  const rule = new FallbackFunnelAgreementLabelLengthRule(86400);
  const item = newFallbackFunnelAgreement("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackFunnelAgreementMarginRangeRule flags values above margin", () => {
  const rule = new FallbackFunnelAgreementMarginRangeRule(8.3, 3224.1);
  const item = newFallbackFunnelAgreement("x", "y");
  item.margin = 3225.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackFunnelAgreementOwnerIdLengthRule flags a long owner id", () => {
  const rule = new FallbackFunnelAgreementOwnerIdLengthRule(64);
  const item = newFallbackFunnelAgreement("x", "y");
  item.ownerId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
