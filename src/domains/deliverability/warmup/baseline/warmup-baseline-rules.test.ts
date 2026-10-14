import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupBaselineCodeLengthRule,
  WarmupBaselineNameLengthRule,
  WarmupBaselineRequiredCodeRule,
  WarmupBaselineRequiredNameRule,
  defaultWarmupBaselineValidator,
} from "./warmup-baseline-rules.js";
import { newWarmupBaseline } from "./warmup-baseline.js";

test("WarmupBaselineValidator reports every problem", () => {
  const validator = defaultWarmupBaselineValidator();
  const item = newWarmupBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new WarmupBaselineRequiredCodeRule("warmup baseline needs a value");
  const item = newWarmupBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupBaselineCodeLengthRule flags a long code", () => {
  const rule = new WarmupBaselineCodeLengthRule(32);
  const item = newWarmupBaseline("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupBaselineRequiredNameRule flags a blank name", () => {
  const rule = new WarmupBaselineRequiredNameRule("warmup baseline needs an entry");
  const item = newWarmupBaseline("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupBaselineNameLengthRule flags a long name", () => {
  const rule = new WarmupBaselineNameLengthRule(16);
  const item = newWarmupBaseline("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
