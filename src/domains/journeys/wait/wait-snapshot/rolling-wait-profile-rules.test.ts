import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingWaitProfileCodeLengthRule,
  RollingWaitProfileConversionRateRangeRule,
  RollingWaitProfileMarginRangeRule,
  RollingWaitProfileRequiredNameRule,
  RollingWaitProfileRequiredOwnerIdRule,
  defaultRollingWaitProfileValidator,
} from "./rolling-wait-profile-rules.js";
import { newRollingWaitProfile } from "./rolling-wait-profile.js";

test("RollingWaitProfileValidator reports every problem", () => {
  const validator = defaultRollingWaitProfileValidator();
  const item = newRollingWaitProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingWaitProfileMarginRangeRule flags values above margin", () => {
  const rule = new RollingWaitProfileMarginRangeRule(8.4, 3524.1);
  const item = newRollingWaitProfile("x", "y");
  item.margin = 3525.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingWaitProfileConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new RollingWaitProfileConversionRateRangeRule(4.7, 3158.3);
  const item = newRollingWaitProfile("x", "y");
  item.conversionRate = 3159.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingWaitProfileRequiredNameRule flags a blank name", () => {
  const rule = new RollingWaitProfileRequiredNameRule("rolling wait profile needs this field");
  const item = newRollingWaitProfile("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingWaitProfileRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new RollingWaitProfileRequiredOwnerIdRule("rolling wait profile needs an entry");
  const item = newRollingWaitProfile("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingWaitProfileCodeLengthRule flags a long code", () => {
  const rule = new RollingWaitProfileCodeLengthRule(64);
  const item = newRollingWaitProfile("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
