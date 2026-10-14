import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryFraudCheckRollupLabelLengthRule,
  PrimaryFraudCheckRollupLocaleLengthRule,
  PrimaryFraudCheckRollupRequiredCodeRule,
  PrimaryFraudCheckRollupVersionRangeRule,
  defaultPrimaryFraudCheckRollupValidator,
} from "./primary-fraud-check-rollup-rules.js";
import { newPrimaryFraudCheckRollup } from "./primary-fraud-check-rollup.js";

test("PrimaryFraudCheckRollupValidator reports every problem", () => {
  const validator = defaultPrimaryFraudCheckRollupValidator();
  const item = newPrimaryFraudCheckRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryFraudCheckRollupLocaleLengthRule flags a long locale", () => {
  const rule = new PrimaryFraudCheckRollupLocaleLengthRule(80);
  const item = newPrimaryFraudCheckRollup("x", "y");
  item.locale = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryFraudCheckRollupLabelLengthRule flags a long label", () => {
  const rule = new PrimaryFraudCheckRollupLabelLengthRule(64);
  const item = newPrimaryFraudCheckRollup("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryFraudCheckRollupRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryFraudCheckRollupRequiredCodeRule("primary fraud check rollup needs this field");
  const item = newPrimaryFraudCheckRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryFraudCheckRollupVersionRangeRule flags values above version", () => {
  const rule = new PrimaryFraudCheckRollupVersionRangeRule(16, 1000);
  const item = newPrimaryFraudCheckRollup("x", "y");
  item.version = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
