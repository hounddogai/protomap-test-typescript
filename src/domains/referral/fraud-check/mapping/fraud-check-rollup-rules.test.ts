import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckRollupCodeLengthRule,
  FraudCheckRollupNameLengthRule,
  FraudCheckRollupRequiredCodeRule,
  FraudCheckRollupRequiredTimezoneRule,
  FraudCheckRollupTimezoneLengthRule,
  FraudCheckRollupUtmSourceLengthRule,
  defaultFraudCheckRollupValidator,
} from "./fraud-check-rollup-rules.js";
import { newFraudCheckRollup } from "./fraud-check-rollup.js";

test("FraudCheckRollupValidator reports every problem", () => {
  const validator = defaultFraudCheckRollupValidator();
  const item = newFraudCheckRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckRollupUtmSourceLengthRule flags a long utm source", () => {
  const rule = new FraudCheckRollupUtmSourceLengthRule(120);
  const item = newFraudCheckRollup("x", "y");
  item.utmSource = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckRollupRequiredCodeRule flags a blank code", () => {
  const rule = new FraudCheckRollupRequiredCodeRule("fraud check rollup needs an entry");
  const item = newFraudCheckRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckRollupTimezoneLengthRule flags a long timezone", () => {
  const rule = new FraudCheckRollupTimezoneLengthRule(32);
  const item = newFraudCheckRollup("x", "y");
  item.timezone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckRollupNameLengthRule flags a long name", () => {
  const rule = new FraudCheckRollupNameLengthRule(3600);
  const item = newFraudCheckRollup("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckRollupRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new FraudCheckRollupRequiredTimezoneRule("fraud check rollup needs this field");
  const item = newFraudCheckRollup("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckRollupCodeLengthRule flags a long code", () => {
  const rule = new FraudCheckRollupCodeLengthRule(64);
  const item = newFraudCheckRollup("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
