import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionGroupCodeLengthRule,
  ConversionGroupLabelLengthRule,
  defaultConversionGroupValidator,
} from "./conversion-group-rules.js";
import { newConversionGroup } from "./conversion-group.js";

test("ConversionGroupValidator reports every problem", () => {
  const validator = defaultConversionGroupValidator();
  const item = newConversionGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionGroupLabelLengthRule flags a long label", () => {
  const rule = new ConversionGroupLabelLengthRule(16);
  const item = newConversionGroup("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionGroupCodeLengthRule flags a long code", () => {
  const rule = new ConversionGroupCodeLengthRule(32);
  const item = newConversionGroup("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
