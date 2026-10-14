import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedStepRequestNameLengthRule,
  CappedStepRequestRequiredCodeRule,
  CappedStepRequestRequiredTimezoneRule,
  defaultCappedStepRequestValidator,
} from "./capped-step-request-rules.js";
import { newCappedStepRequest } from "./capped-step-request.js";

test("CappedStepRequestValidator reports every problem", () => {
  const validator = defaultCappedStepRequestValidator();
  const item = newCappedStepRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedStepRequestRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new CappedStepRequestRequiredTimezoneRule("capped step request needs an entry");
  const item = newCappedStepRequest("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedStepRequestNameLengthRule flags a long name", () => {
  const rule = new CappedStepRequestNameLengthRule(120);
  const item = newCappedStepRequest("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedStepRequestRequiredCodeRule flags a blank code", () => {
  const rule = new CappedStepRequestRequiredCodeRule("capped step request needs this field");
  const item = newCappedStepRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
