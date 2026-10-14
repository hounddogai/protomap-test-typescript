import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryPathSlotCodeLengthRule,
  PrimaryPathSlotNameLengthRule,
  PrimaryPathSlotRequiredCodeRule,
  PrimaryPathSlotWeightRangeRule,
  defaultPrimaryPathSlotValidator,
} from "./primary-path-slot-rules.js";
import { newPrimaryPathSlot } from "./primary-path-slot.js";

test("PrimaryPathSlotValidator reports every problem", () => {
  const validator = defaultPrimaryPathSlotValidator();
  const item = newPrimaryPathSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryPathSlotCodeLengthRule flags a long code", () => {
  const rule = new PrimaryPathSlotCodeLengthRule(32);
  const item = newPrimaryPathSlot("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryPathSlotNameLengthRule flags a long name", () => {
  const rule = new PrimaryPathSlotNameLengthRule(1000);
  const item = newPrimaryPathSlot("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryPathSlotWeightRangeRule flags values above weight", () => {
  const rule = new PrimaryPathSlotWeightRangeRule(3, 2149.7);
  const item = newPrimaryPathSlot("x", "y");
  item.weight = 2151.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryPathSlotRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryPathSlotRequiredCodeRule("primary path slot needs a value");
  const item = newPrimaryPathSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
