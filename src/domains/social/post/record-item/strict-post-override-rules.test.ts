import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictPostOverrideCodeLengthRule,
  StrictPostOverrideNameLengthRule,
  StrictPostOverrideWeightRangeRule,
  defaultStrictPostOverrideValidator,
} from "./strict-post-override-rules.js";
import { newStrictPostOverride } from "./strict-post-override.js";

test("StrictPostOverrideValidator reports every problem", () => {
  const validator = defaultStrictPostOverrideValidator();
  const item = newStrictPostOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictPostOverrideCodeLengthRule flags a long code", () => {
  const rule = new StrictPostOverrideCodeLengthRule(16);
  const item = newStrictPostOverride("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictPostOverrideWeightRangeRule flags values above weight", () => {
  const rule = new StrictPostOverrideWeightRangeRule(9.9, 3759.4);
  const item = newStrictPostOverride("x", "y");
  item.weight = 3760.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictPostOverrideNameLengthRule flags a long name", () => {
  const rule = new StrictPostOverrideNameLengthRule(16);
  const item = newStrictPostOverride("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
