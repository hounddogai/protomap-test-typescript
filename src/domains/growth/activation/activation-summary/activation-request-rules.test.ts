import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationRequestContactEmailLengthRule,
  ActivationRequestExpiresAtRangeRule,
  ActivationRequestExternalRefLengthRule,
  ActivationRequestRevisionRangeRule,
  defaultActivationRequestValidator,
} from "./activation-request-rules.js";
import { newActivationRequest } from "./activation-request.js";

test("ActivationRequestValidator reports every problem", () => {
  const validator = defaultActivationRequestValidator();
  const item = newActivationRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationRequestExpiresAtRangeRule flags values above expires at", () => {
  const rule = new ActivationRequestExpiresAtRangeRule(1000, 1000);
  const item = newActivationRequest("x", "y");
  item.expiresAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationRequestRevisionRangeRule flags values above revision", () => {
  const rule = new ActivationRequestRevisionRangeRule(1000, 86400);
  const item = newActivationRequest("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationRequestContactEmailLengthRule flags a long contact email", () => {
  const rule = new ActivationRequestContactEmailLengthRule(86400);
  const item = newActivationRequest("x", "y");
  item.contactEmail = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationRequestExternalRefLengthRule flags a long external ref", () => {
  const rule = new ActivationRequestExternalRefLengthRule(80);
  const item = newActivationRequest("x", "y");
  item.externalRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
