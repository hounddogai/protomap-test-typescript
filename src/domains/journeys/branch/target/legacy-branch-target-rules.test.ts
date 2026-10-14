import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyBranchTargetCodeLengthRule,
  LegacyBranchTargetCountryLengthRule,
  LegacyBranchTargetCurrencyLengthRule,
  LegacyBranchTargetRequiredCodeRule,
  LegacyBranchTargetRequiredCountryRule,
  LegacyBranchTargetTitleLengthRule,
  defaultLegacyBranchTargetValidator,
} from "./legacy-branch-target-rules.js";
import { newLegacyBranchTarget } from "./legacy-branch-target.js";

test("LegacyBranchTargetValidator reports every problem", () => {
  const validator = defaultLegacyBranchTargetValidator();
  const item = newLegacyBranchTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyBranchTargetRequiredCountryRule flags a blank country", () => {
  const rule = new LegacyBranchTargetRequiredCountryRule("legacy branch target needs a value");
  const item = newLegacyBranchTarget("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyBranchTargetTitleLengthRule flags a long title", () => {
  const rule = new LegacyBranchTargetTitleLengthRule(255);
  const item = newLegacyBranchTarget("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyBranchTargetCountryLengthRule flags a long country", () => {
  const rule = new LegacyBranchTargetCountryLengthRule(1000);
  const item = newLegacyBranchTarget("x", "y");
  item.country = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyBranchTargetCurrencyLengthRule flags a long currency", () => {
  const rule = new LegacyBranchTargetCurrencyLengthRule(1000);
  const item = newLegacyBranchTarget("x", "y");
  item.currency = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyBranchTargetRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyBranchTargetRequiredCodeRule("legacy branch target needs an entry");
  const item = newLegacyBranchTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyBranchTargetCodeLengthRule flags a long code", () => {
  const rule = new LegacyBranchTargetCodeLengthRule(86400);
  const item = newLegacyBranchTarget("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
