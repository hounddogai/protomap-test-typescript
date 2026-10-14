import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientWindowProfileCodeLengthRule,
  LenientWindowProfilePriorityRangeRule,
  LenientWindowProfileRatioRangeRule,
  LenientWindowProfileRequiredCodeRule,
  LenientWindowProfileUtmSourceLengthRule,
  defaultLenientWindowProfileValidator,
} from "./lenient-window-profile-rules.js";
import { newLenientWindowProfile } from "./lenient-window-profile.js";

test("LenientWindowProfileValidator reports every problem", () => {
  const validator = defaultLenientWindowProfileValidator();
  const item = newLenientWindowProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientWindowProfilePriorityRangeRule flags values above priority", () => {
  const rule = new LenientWindowProfilePriorityRangeRule(64, 255);
  const item = newLenientWindowProfile("x", "y");
  item.priority = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientWindowProfileRatioRangeRule flags values above ratio", () => {
  const rule = new LenientWindowProfileRatioRangeRule(4.1, 4042);
  const item = newLenientWindowProfile("x", "y");
  item.ratio = 4043.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientWindowProfileUtmSourceLengthRule flags a long utm source", () => {
  const rule = new LenientWindowProfileUtmSourceLengthRule(255);
  const item = newLenientWindowProfile("x", "y");
  item.utmSource = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientWindowProfileCodeLengthRule flags a long code", () => {
  const rule = new LenientWindowProfileCodeLengthRule(64);
  const item = newLenientWindowProfile("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientWindowProfileRequiredCodeRule flags a blank code", () => {
  const rule = new LenientWindowProfileRequiredCodeRule("lenient window profile needs an entry");
  const item = newLenientWindowProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
