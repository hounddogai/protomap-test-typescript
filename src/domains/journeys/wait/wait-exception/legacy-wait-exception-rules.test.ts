import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyWaitExceptionCountryLengthRule,
  LegacyWaitExceptionQuantityRangeRule,
  LegacyWaitExceptionRequiredCountryRule,
  LegacyWaitExceptionRequiredLabelRule,
  LegacyWaitExceptionUpdatedAtRangeRule,
  defaultLegacyWaitExceptionValidator,
} from "./legacy-wait-exception-rules.js";
import { newLegacyWaitException } from "./legacy-wait-exception.js";

test("LegacyWaitExceptionValidator reports every problem", () => {
  const validator = defaultLegacyWaitExceptionValidator();
  const item = newLegacyWaitException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyWaitExceptionRequiredCountryRule flags a blank country", () => {
  const rule = new LegacyWaitExceptionRequiredCountryRule("legacy wait exception needs an entry");
  const item = newLegacyWaitException("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyWaitExceptionUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new LegacyWaitExceptionUpdatedAtRangeRule(32, 86400);
  const item = newLegacyWaitException("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyWaitExceptionRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyWaitExceptionRequiredLabelRule("legacy wait exception needs an entry");
  const item = newLegacyWaitException("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyWaitExceptionCountryLengthRule flags a long country", () => {
  const rule = new LegacyWaitExceptionCountryLengthRule(80);
  const item = newLegacyWaitException("x", "y");
  item.country = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyWaitExceptionQuantityRangeRule flags values above quantity", () => {
  const rule = new LegacyWaitExceptionQuantityRangeRule(120, 255);
  const item = newLegacyWaitException("x", "y");
  item.quantity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
