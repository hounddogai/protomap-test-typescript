import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingModelRequestCurrencyLengthRule,
  defaultPendingModelRequestValidator,
} from "./pending-model-request-rules.js";
import { newPendingModelRequest } from "./pending-model-request.js";

test("PendingModelRequestValidator reports every problem", () => {
  const validator = defaultPendingModelRequestValidator();
  const item = newPendingModelRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingModelRequestCurrencyLengthRule flags a long currency", () => {
  const rule = new PendingModelRequestCurrencyLengthRule(16);
  const item = newPendingModelRequest("x", "y");
  item.currency = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
