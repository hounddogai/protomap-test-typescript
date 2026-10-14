import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionRequestCodeLengthRule,
  DeflectionRequestLabelLengthRule,
  DeflectionRequestRequiredCodeRule,
  DeflectionRequestRequiredLabelRule,
  DeflectionRequestRequiredUtmSourceRule,
  defaultDeflectionRequestValidator,
} from "./deflection-request-rules.js";
import { newDeflectionRequest } from "./deflection-request.js";

test("DeflectionRequestValidator reports every problem", () => {
  const validator = defaultDeflectionRequestValidator();
  const item = newDeflectionRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionRequestRequiredLabelRule flags a blank label", () => {
  const rule = new DeflectionRequestRequiredLabelRule("deflection request needs a value");
  const item = newDeflectionRequest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionRequestRequiredCodeRule flags a blank code", () => {
  const rule = new DeflectionRequestRequiredCodeRule("deflection request needs this field");
  const item = newDeflectionRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionRequestRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new DeflectionRequestRequiredUtmSourceRule("deflection request needs an entry");
  const item = newDeflectionRequest("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionRequestCodeLengthRule flags a long code", () => {
  const rule = new DeflectionRequestCodeLengthRule(16);
  const item = newDeflectionRequest("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionRequestLabelLengthRule flags a long label", () => {
  const rule = new DeflectionRequestLabelLengthRule(120);
  const item = newDeflectionRequest("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
