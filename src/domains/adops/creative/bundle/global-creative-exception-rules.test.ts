import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalCreativeExceptionCountryLengthRule,
  GlobalCreativeExceptionRequiredCountryRule,
  GlobalCreativeExceptionRequiredLabelRule,
  GlobalCreativeExceptionRequiredNameRule,
  defaultGlobalCreativeExceptionValidator,
} from "./global-creative-exception-rules.js";
import { newGlobalCreativeException } from "./global-creative-exception.js";

test("GlobalCreativeExceptionValidator reports every problem", () => {
  const validator = defaultGlobalCreativeExceptionValidator();
  const item = newGlobalCreativeException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalCreativeExceptionRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalCreativeExceptionRequiredLabelRule("global creative exception needs an entry");
  const item = newGlobalCreativeException("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalCreativeExceptionRequiredCountryRule flags a blank country", () => {
  const rule = new GlobalCreativeExceptionRequiredCountryRule("global creative exception needs a value");
  const item = newGlobalCreativeException("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalCreativeExceptionRequiredNameRule flags a blank name", () => {
  const rule = new GlobalCreativeExceptionRequiredNameRule("global creative exception needs an entry");
  const item = newGlobalCreativeException("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalCreativeExceptionCountryLengthRule flags a long country", () => {
  const rule = new GlobalCreativeExceptionCountryLengthRule(32);
  const item = newGlobalCreativeException("x", "y");
  item.country = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
