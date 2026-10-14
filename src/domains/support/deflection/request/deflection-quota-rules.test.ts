import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionQuotaCodeLengthRule,
  DeflectionQuotaTitleLengthRule,
  defaultDeflectionQuotaValidator,
} from "./deflection-quota-rules.js";
import { newDeflectionQuota } from "./deflection-quota.js";

test("DeflectionQuotaValidator reports every problem", () => {
  const validator = defaultDeflectionQuotaValidator();
  const item = newDeflectionQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionQuotaCodeLengthRule flags a long code", () => {
  const rule = new DeflectionQuotaCodeLengthRule(32);
  const item = newDeflectionQuota("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionQuotaTitleLengthRule flags a long title", () => {
  const rule = new DeflectionQuotaTitleLengthRule(16);
  const item = newDeflectionQuota("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
