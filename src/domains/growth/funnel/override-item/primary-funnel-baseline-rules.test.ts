import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryFunnelBaselineCohortLengthRule,
  PrimaryFunnelBaselineNameLengthRule,
  PrimaryFunnelBaselineRequiredNameRule,
  PrimaryFunnelBaselineSequenceRangeRule,
  defaultPrimaryFunnelBaselineValidator,
} from "./primary-funnel-baseline-rules.js";
import { newPrimaryFunnelBaseline } from "./primary-funnel-baseline.js";

test("PrimaryFunnelBaselineValidator reports every problem", () => {
  const validator = defaultPrimaryFunnelBaselineValidator();
  const item = newPrimaryFunnelBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryFunnelBaselineNameLengthRule flags a long name", () => {
  const rule = new PrimaryFunnelBaselineNameLengthRule(16);
  const item = newPrimaryFunnelBaseline("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryFunnelBaselineRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryFunnelBaselineRequiredNameRule("primary funnel baseline needs an entry");
  const item = newPrimaryFunnelBaseline("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryFunnelBaselineSequenceRangeRule flags values above sequence", () => {
  const rule = new PrimaryFunnelBaselineSequenceRangeRule(32, 64);
  const item = newPrimaryFunnelBaseline("x", "y");
  item.sequence = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryFunnelBaselineCohortLengthRule flags a long cohort", () => {
  const rule = new PrimaryFunnelBaselineCohortLengthRule(120);
  const item = newPrimaryFunnelBaseline("x", "y");
  item.cohort = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
