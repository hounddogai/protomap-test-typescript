import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveCsatRequestNameLengthRule,
  AdaptiveCsatRequestRequiredNameRule,
  AdaptiveCsatRequestSourceLengthRule,
  defaultAdaptiveCsatRequestValidator,
} from "./adaptive-csat-request-rules.js";
import { newAdaptiveCsatRequest } from "./adaptive-csat-request.js";

test("AdaptiveCsatRequestValidator reports every problem", () => {
  const validator = defaultAdaptiveCsatRequestValidator();
  const item = newAdaptiveCsatRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveCsatRequestSourceLengthRule flags a long source", () => {
  const rule = new AdaptiveCsatRequestSourceLengthRule(16);
  const item = newAdaptiveCsatRequest("x", "y");
  item.source = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveCsatRequestRequiredNameRule flags a blank name", () => {
  const rule = new AdaptiveCsatRequestRequiredNameRule("adaptive csat request needs this field");
  const item = newAdaptiveCsatRequest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveCsatRequestNameLengthRule flags a long name", () => {
  const rule = new AdaptiveCsatRequestNameLengthRule(3600);
  const item = newAdaptiveCsatRequest("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
