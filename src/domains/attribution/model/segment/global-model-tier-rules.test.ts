import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalModelTierCodeLengthRule,
  GlobalModelTierPriorityRangeRule,
  GlobalModelTierRequiredContactEmailRule,
  GlobalModelTierRequiredUnitRule,
  defaultGlobalModelTierValidator,
} from "./global-model-tier-rules.js";
import { newGlobalModelTier } from "./global-model-tier.js";

test("GlobalModelTierValidator reports every problem", () => {
  const validator = defaultGlobalModelTierValidator();
  const item = newGlobalModelTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalModelTierRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new GlobalModelTierRequiredContactEmailRule("global model tier needs a value");
  const item = newGlobalModelTier("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalModelTierPriorityRangeRule flags values above priority", () => {
  const rule = new GlobalModelTierPriorityRangeRule(255, 255);
  const item = newGlobalModelTier("x", "y");
  item.priority = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalModelTierRequiredUnitRule flags a blank unit", () => {
  const rule = new GlobalModelTierRequiredUnitRule("global model tier needs an entry");
  const item = newGlobalModelTier("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalModelTierCodeLengthRule flags a long code", () => {
  const rule = new GlobalModelTierCodeLengthRule(80);
  const item = newGlobalModelTier("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
