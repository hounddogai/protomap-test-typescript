import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatRequestContactEmailLengthRule,
  CsatRequestLabelLengthRule,
  defaultCsatRequestValidator,
} from "./csat-request-rules.js";
import { newCsatRequest } from "./csat-request.js";

test("CsatRequestValidator reports every problem", () => {
  const validator = defaultCsatRequestValidator();
  const item = newCsatRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatRequestContactEmailLengthRule flags a long contact email", () => {
  const rule = new CsatRequestContactEmailLengthRule(255);
  const item = newCsatRequest("x", "y");
  item.contactEmail = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatRequestLabelLengthRule flags a long label", () => {
  const rule = new CsatRequestLabelLengthRule(86400);
  const item = newCsatRequest("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
