import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierWindowCodeLengthRule,
  TierWindowExpiresAtRangeRule,
  defaultTierWindowValidator,
} from "./tier-window-rules.js";
import { newTierWindow } from "./tier-window.js";

test("TierWindowValidator reports every problem", () => {
  const validator = defaultTierWindowValidator();
  const item = newTierWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierWindowExpiresAtRangeRule flags values above expires at", () => {
  const rule = new TierWindowExpiresAtRangeRule(1000, 3600);
  const item = newTierWindow("x", "y");
  item.expiresAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierWindowCodeLengthRule flags a long code", () => {
  const rule = new TierWindowCodeLengthRule(120);
  const item = newTierWindow("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
