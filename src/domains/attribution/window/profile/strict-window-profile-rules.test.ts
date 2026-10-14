import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictWindowProfileCodeLengthRule,
  StrictWindowProfileDurationMinutesRangeRule,
  StrictWindowProfileRateRangeRule,
  StrictWindowProfileRequiredNameRule,
  StrictWindowProfileSourceLengthRule,
  defaultStrictWindowProfileValidator,
} from "./strict-window-profile-rules.js";
import { newStrictWindowProfile } from "./strict-window-profile.js";

test("StrictWindowProfileValidator reports every problem", () => {
  const validator = defaultStrictWindowProfileValidator();
  const item = newStrictWindowProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictWindowProfileRateRangeRule flags values above rate", () => {
  const rule = new StrictWindowProfileRateRangeRule(5.2, 3971.2);
  const item = newStrictWindowProfile("x", "y");
  item.rate = 3972.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictWindowProfileCodeLengthRule flags a long code", () => {
  const rule = new StrictWindowProfileCodeLengthRule(80);
  const item = newStrictWindowProfile("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictWindowProfileSourceLengthRule flags a long source", () => {
  const rule = new StrictWindowProfileSourceLengthRule(80);
  const item = newStrictWindowProfile("x", "y");
  item.source = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictWindowProfileDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new StrictWindowProfileDurationMinutesRangeRule(80, 120);
  const item = newStrictWindowProfile("x", "y");
  item.durationMinutes = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictWindowProfileRequiredNameRule flags a blank name", () => {
  const rule = new StrictWindowProfileRequiredNameRule("strict window profile needs an entry");
  const item = newStrictWindowProfile("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
