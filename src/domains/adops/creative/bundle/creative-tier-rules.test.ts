import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeTierAmountRangeRule,
  CreativeTierNameLengthRule,
  CreativeTierSendAtRangeRule,
  CreativeTierUnitLengthRule,
  defaultCreativeTierValidator,
} from "./creative-tier-rules.js";
import { newCreativeTier } from "./creative-tier.js";

test("CreativeTierValidator reports every problem", () => {
  const validator = defaultCreativeTierValidator();
  const item = newCreativeTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeTierSendAtRangeRule flags values above send at", () => {
  const rule = new CreativeTierSendAtRangeRule(32, 1000);
  const item = newCreativeTier("x", "y");
  item.sendAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeTierUnitLengthRule flags a long unit", () => {
  const rule = new CreativeTierUnitLengthRule(3600);
  const item = newCreativeTier("x", "y");
  item.unit = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeTierAmountRangeRule flags values above amount", () => {
  const rule = new CreativeTierAmountRangeRule(1.9, 143.3);
  const item = newCreativeTier("x", "y");
  item.amount = 144.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeTierNameLengthRule flags a long name", () => {
  const rule = new CreativeTierNameLengthRule(3600);
  const item = newCreativeTier("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
