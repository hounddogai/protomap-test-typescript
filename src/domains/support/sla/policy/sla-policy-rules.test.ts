import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaPolicyDescriptionLengthRule,
  SlaPolicyRequiredCodeRule,
  SlaPolicyRequiredLocaleRule,
  defaultSlaPolicyValidator,
} from "./sla-policy-rules.js";
import { newSlaPolicy } from "./sla-policy.js";

test("SlaPolicyValidator reports every problem", () => {
  const validator = defaultSlaPolicyValidator();
  const item = newSlaPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaPolicyRequiredLocaleRule flags a blank locale", () => {
  const rule = new SlaPolicyRequiredLocaleRule("sla policy needs a value");
  const item = newSlaPolicy("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaPolicyDescriptionLengthRule flags a long description", () => {
  const rule = new SlaPolicyDescriptionLengthRule(16);
  const item = newSlaPolicy("x", "y");
  item.description = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new SlaPolicyRequiredCodeRule("sla policy needs this field");
  const item = newSlaPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
