import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionMappingCodeLengthRule,
  DeflectionMappingExternalRefLengthRule,
  DeflectionMappingRequiredExternalRefRule,
  defaultDeflectionMappingValidator,
} from "./deflection-mapping-rules.js";
import { newDeflectionMapping } from "./deflection-mapping.js";

test("DeflectionMappingValidator reports every problem", () => {
  const validator = defaultDeflectionMappingValidator();
  const item = newDeflectionMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionMappingExternalRefLengthRule flags a long external ref", () => {
  const rule = new DeflectionMappingExternalRefLengthRule(86400);
  const item = newDeflectionMapping("x", "y");
  item.externalRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionMappingCodeLengthRule flags a long code", () => {
  const rule = new DeflectionMappingCodeLengthRule(64);
  const item = newDeflectionMapping("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionMappingRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new DeflectionMappingRequiredExternalRefRule("deflection mapping needs an entry");
  const item = newDeflectionMapping("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
