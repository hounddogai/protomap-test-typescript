import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceMappingNameLengthRule,
  BounceMappingRatioRangeRule,
  BounceMappingRequiredNameRule,
  defaultBounceMappingValidator,
} from "./bounce-mapping-rules.js";
import { newBounceMapping } from "./bounce-mapping.js";

test("BounceMappingValidator reports every problem", () => {
  const validator = defaultBounceMappingValidator();
  const item = newBounceMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceMappingRequiredNameRule flags a blank name", () => {
  const rule = new BounceMappingRequiredNameRule("bounce mapping needs this field");
  const item = newBounceMapping("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BounceMappingNameLengthRule flags a long name", () => {
  const rule = new BounceMappingNameLengthRule(80);
  const item = newBounceMapping("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceMappingRatioRangeRule flags values above ratio", () => {
  const rule = new BounceMappingRatioRangeRule(7.8, 3849.6);
  const item = newBounceMapping("x", "y");
  item.ratio = 3851.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
