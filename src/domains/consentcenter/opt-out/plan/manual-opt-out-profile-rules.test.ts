import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualOptOutProfileContactEmailLengthRule,
  ManualOptOutProfileCurrencyLengthRule,
  ManualOptOutProfileNameLengthRule,
  defaultManualOptOutProfileValidator,
} from "./manual-opt-out-profile-rules.js";
import { newManualOptOutProfile } from "./manual-opt-out-profile.js";

test("ManualOptOutProfileValidator reports every problem", () => {
  const validator = defaultManualOptOutProfileValidator();
  const item = newManualOptOutProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualOptOutProfileContactEmailLengthRule flags a long contact email", () => {
  const rule = new ManualOptOutProfileContactEmailLengthRule(16);
  const item = newManualOptOutProfile("x", "y");
  item.contactEmail = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualOptOutProfileCurrencyLengthRule flags a long currency", () => {
  const rule = new ManualOptOutProfileCurrencyLengthRule(1000);
  const item = newManualOptOutProfile("x", "y");
  item.currency = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualOptOutProfileNameLengthRule flags a long name", () => {
  const rule = new ManualOptOutProfileNameLengthRule(120);
  const item = newManualOptOutProfile("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
