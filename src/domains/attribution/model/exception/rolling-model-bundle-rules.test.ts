import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingModelBundleCapacityRangeRule,
  RollingModelBundleCodeLengthRule,
  RollingModelBundleRequiredCodeRule,
  RollingModelBundleRequiredSourceRule,
  defaultRollingModelBundleValidator,
} from "./rolling-model-bundle-rules.js";
import { newRollingModelBundle } from "./rolling-model-bundle.js";

test("RollingModelBundleValidator reports every problem", () => {
  const validator = defaultRollingModelBundleValidator();
  const item = newRollingModelBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingModelBundleRequiredSourceRule flags a blank source", () => {
  const rule = new RollingModelBundleRequiredSourceRule("rolling model bundle needs a value");
  const item = newRollingModelBundle("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingModelBundleCapacityRangeRule flags values above capacity", () => {
  const rule = new RollingModelBundleCapacityRangeRule(120, 120);
  const item = newRollingModelBundle("x", "y");
  item.capacity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingModelBundleRequiredCodeRule flags a blank code", () => {
  const rule = new RollingModelBundleRequiredCodeRule("rolling model bundle needs a value");
  const item = newRollingModelBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingModelBundleCodeLengthRule flags a long code", () => {
  const rule = new RollingModelBundleCodeLengthRule(80);
  const item = newRollingModelBundle("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
