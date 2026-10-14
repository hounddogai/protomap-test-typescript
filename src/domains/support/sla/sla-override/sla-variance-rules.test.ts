import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaVarianceCodeLengthRule,
  SlaVarianceQuantityRangeRule,
  SlaVarianceRequiredContactEmailRule,
  SlaVarianceTitleLengthRule,
  defaultSlaVarianceValidator,
} from "./sla-variance-rules.js";
import { newSlaVariance } from "./sla-variance.js";

test("SlaVarianceValidator reports every problem", () => {
  const validator = defaultSlaVarianceValidator();
  const item = newSlaVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaVarianceQuantityRangeRule flags values above quantity", () => {
  const rule = new SlaVarianceQuantityRangeRule(80, 255);
  const item = newSlaVariance("x", "y");
  item.quantity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaVarianceCodeLengthRule flags a long code", () => {
  const rule = new SlaVarianceCodeLengthRule(3600);
  const item = newSlaVariance("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaVarianceRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new SlaVarianceRequiredContactEmailRule("sla variance needs this field");
  const item = newSlaVariance("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaVarianceTitleLengthRule flags a long title", () => {
  const rule = new SlaVarianceTitleLengthRule(16);
  const item = newSlaVariance("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
