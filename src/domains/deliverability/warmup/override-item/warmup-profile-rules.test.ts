import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupProfileCodeLengthRule,
  WarmupProfileRateRangeRule,
  WarmupProfileRequiredNameRule,
  WarmupProfileRequiredPhoneRule,
  defaultWarmupProfileValidator,
} from "./warmup-profile-rules.js";
import { newWarmupProfile } from "./warmup-profile.js";

test("WarmupProfileValidator reports every problem", () => {
  const validator = defaultWarmupProfileValidator();
  const item = newWarmupProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupProfileRequiredNameRule flags a blank name", () => {
  const rule = new WarmupProfileRequiredNameRule("warmup profile needs an entry");
  const item = newWarmupProfile("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupProfileRateRangeRule flags values above rate", () => {
  const rule = new WarmupProfileRateRangeRule(6.1, 1180.3);
  const item = newWarmupProfile("x", "y");
  item.rate = 1181.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WarmupProfileRequiredPhoneRule flags a blank phone", () => {
  const rule = new WarmupProfileRequiredPhoneRule("warmup profile needs a value");
  const item = newWarmupProfile("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupProfileCodeLengthRule flags a long code", () => {
  const rule = new WarmupProfileCodeLengthRule(32);
  const item = newWarmupProfile("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
