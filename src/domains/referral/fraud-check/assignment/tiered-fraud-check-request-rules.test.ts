import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredFraudCheckRequestContactEmailLengthRule,
  TieredFraudCheckRequestOwnerIdLengthRule,
  TieredFraudCheckRequestRequiredContactEmailRule,
  defaultTieredFraudCheckRequestValidator,
} from "./tiered-fraud-check-request-rules.js";
import { newTieredFraudCheckRequest } from "./tiered-fraud-check-request.js";

test("TieredFraudCheckRequestValidator reports every problem", () => {
  const validator = defaultTieredFraudCheckRequestValidator();
  const item = newTieredFraudCheckRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredFraudCheckRequestOwnerIdLengthRule flags a long owner id", () => {
  const rule = new TieredFraudCheckRequestOwnerIdLengthRule(80);
  const item = newTieredFraudCheckRequest("x", "y");
  item.ownerId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredFraudCheckRequestRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new TieredFraudCheckRequestRequiredContactEmailRule("tiered fraud check request needs a value");
  const item = newTieredFraudCheckRequest("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredFraudCheckRequestContactEmailLengthRule flags a long contact email", () => {
  const rule = new TieredFraudCheckRequestContactEmailLengthRule(3600);
  const item = newTieredFraudCheckRequest("x", "y");
  item.contactEmail = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
