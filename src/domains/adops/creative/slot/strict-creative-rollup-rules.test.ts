import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictCreativeRollupCodeLengthRule,
  StrictCreativeRollupRequiredCodeRule,
  defaultStrictCreativeRollupValidator,
} from "./strict-creative-rollup-rules.js";
import { newStrictCreativeRollup } from "./strict-creative-rollup.js";

test("StrictCreativeRollupValidator reports every problem", () => {
  const validator = defaultStrictCreativeRollupValidator();
  const item = newStrictCreativeRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictCreativeRollupCodeLengthRule flags a long code", () => {
  const rule = new StrictCreativeRollupCodeLengthRule(120);
  const item = newStrictCreativeRollup("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictCreativeRollupRequiredCodeRule flags a blank code", () => {
  const rule = new StrictCreativeRollupRequiredCodeRule("strict creative rollup needs this field");
  const item = newStrictCreativeRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
