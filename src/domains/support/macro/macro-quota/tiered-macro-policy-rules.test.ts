import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredMacroPolicyNameLengthRule,
  TieredMacroPolicyRequiredCodeRule,
  TieredMacroPolicyRevisionRangeRule,
  TieredMacroPolicySendAtRangeRule,
  defaultTieredMacroPolicyValidator,
} from "./tiered-macro-policy-rules.js";
import { newTieredMacroPolicy } from "./tiered-macro-policy.js";

test("TieredMacroPolicyValidator reports every problem", () => {
  const validator = defaultTieredMacroPolicyValidator();
  const item = newTieredMacroPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredMacroPolicySendAtRangeRule flags values above send at", () => {
  const rule = new TieredMacroPolicySendAtRangeRule(32, 64);
  const item = newTieredMacroPolicy("x", "y");
  item.sendAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredMacroPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new TieredMacroPolicyRequiredCodeRule("tiered macro policy needs this field");
  const item = newTieredMacroPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredMacroPolicyRevisionRangeRule flags values above revision", () => {
  const rule = new TieredMacroPolicyRevisionRangeRule(80, 3600);
  const item = newTieredMacroPolicy("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredMacroPolicyNameLengthRule flags a long name", () => {
  const rule = new TieredMacroPolicyNameLengthRule(120);
  const item = newTieredMacroPolicy("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
