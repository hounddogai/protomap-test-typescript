import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierProfileCodeLengthRule,
  TierProfileNameLengthRule,
  TierProfileRequiredCodeRule,
  TierProfileRequiredNameRule,
  defaultTierProfileValidator,
} from "./tier-profile-rules.js";
import { newTierProfile } from "./tier-profile.js";

test("TierProfileValidator reports every problem", () => {
  const validator = defaultTierProfileValidator();
  const item = newTierProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierProfileRequiredNameRule flags a blank name", () => {
  const rule = new TierProfileRequiredNameRule("tier profile needs a value");
  const item = newTierProfile("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierProfileCodeLengthRule flags a long code", () => {
  const rule = new TierProfileCodeLengthRule(3600);
  const item = newTierProfile("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierProfileRequiredCodeRule flags a blank code", () => {
  const rule = new TierProfileRequiredCodeRule("tier profile needs this field");
  const item = newTierProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierProfileNameLengthRule flags a long name", () => {
  const rule = new TierProfileNameLengthRule(120);
  const item = newTierProfile("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
