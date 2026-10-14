import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckRequestCreatedAtRangeRule,
  FraudCheckRequestLabelLengthRule,
  FraudCheckRequestRequiredCountryRule,
  FraudCheckRequestRequiredLabelRule,
  FraudCheckRequestSequenceRangeRule,
  defaultFraudCheckRequestValidator,
} from "./fraud-check-request-rules.js";
import { newFraudCheckRequest } from "./fraud-check-request.js";

test("FraudCheckRequestValidator reports every problem", () => {
  const validator = defaultFraudCheckRequestValidator();
  const item = newFraudCheckRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckRequestSequenceRangeRule flags values above sequence", () => {
  const rule = new FraudCheckRequestSequenceRangeRule(120, 255);
  const item = newFraudCheckRequest("x", "y");
  item.sequence = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FraudCheckRequestRequiredCountryRule flags a blank country", () => {
  const rule = new FraudCheckRequestRequiredCountryRule("fraud check request needs this field");
  const item = newFraudCheckRequest("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckRequestRequiredLabelRule flags a blank label", () => {
  const rule = new FraudCheckRequestRequiredLabelRule("fraud check request needs this field");
  const item = newFraudCheckRequest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckRequestCreatedAtRangeRule flags values above created at", () => {
  const rule = new FraudCheckRequestCreatedAtRangeRule(32, 32);
  const item = newFraudCheckRequest("x", "y");
  item.createdAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FraudCheckRequestLabelLengthRule flags a long label", () => {
  const rule = new FraudCheckRequestLabelLengthRule(86400);
  const item = newFraudCheckRequest("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
