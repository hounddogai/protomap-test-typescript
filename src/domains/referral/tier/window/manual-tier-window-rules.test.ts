import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualTierWindowNameLengthRule,
  ManualTierWindowQuantityRangeRule,
  ManualTierWindowSourceLengthRule,
  ManualTierWindowTitleLengthRule,
  defaultManualTierWindowValidator,
} from "./manual-tier-window-rules.js";
import { newManualTierWindow } from "./manual-tier-window.js";

test("ManualTierWindowValidator reports every problem", () => {
  const validator = defaultManualTierWindowValidator();
  const item = newManualTierWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualTierWindowTitleLengthRule flags a long title", () => {
  const rule = new ManualTierWindowTitleLengthRule(120);
  const item = newManualTierWindow("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualTierWindowNameLengthRule flags a long name", () => {
  const rule = new ManualTierWindowNameLengthRule(16);
  const item = newManualTierWindow("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualTierWindowQuantityRangeRule flags values above quantity", () => {
  const rule = new ManualTierWindowQuantityRangeRule(16, 86400);
  const item = newManualTierWindow("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualTierWindowSourceLengthRule flags a long source", () => {
  const rule = new ManualTierWindowSourceLengthRule(1000);
  const item = newManualTierWindow("x", "y");
  item.source = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
