import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutAdjustmentCodeLengthRule,
  OptOutAdjustmentNameLengthRule,
  OptOutAdjustmentRequiredCodeRule,
  OptOutAdjustmentRequiredNameRule,
  defaultOptOutAdjustmentValidator,
} from "./opt-out-adjustment-rules.js";
import { newOptOutAdjustment } from "./opt-out-adjustment.js";

test("OptOutAdjustmentValidator reports every problem", () => {
  const validator = defaultOptOutAdjustmentValidator();
  const item = newOptOutAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutAdjustmentNameLengthRule flags a long name", () => {
  const rule = new OptOutAdjustmentNameLengthRule(80);
  const item = newOptOutAdjustment("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutAdjustmentRequiredNameRule flags a blank name", () => {
  const rule = new OptOutAdjustmentRequiredNameRule("opt out adjustment needs a value");
  const item = newOptOutAdjustment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new OptOutAdjustmentCodeLengthRule(32);
  const item = newOptOutAdjustment("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new OptOutAdjustmentRequiredCodeRule("opt out adjustment needs an entry");
  const item = newOptOutAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
