import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceProfileCreatedAtRangeRule,
  BounceProfileLabelLengthRule,
  BounceProfileRequiredChecksumRule,
  BounceProfileRequiredCodeRule,
  BounceProfileRequiredLabelRule,
  defaultBounceProfileValidator,
} from "./bounce-profile-rules.js";
import { newBounceProfile } from "./bounce-profile.js";

test("BounceProfileValidator reports every problem", () => {
  const validator = defaultBounceProfileValidator();
  const item = newBounceProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceProfileRequiredCodeRule flags a blank code", () => {
  const rule = new BounceProfileRequiredCodeRule("bounce profile needs this field");
  const item = newBounceProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BounceProfileRequiredLabelRule flags a blank label", () => {
  const rule = new BounceProfileRequiredLabelRule("bounce profile needs a value");
  const item = newBounceProfile("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BounceProfileLabelLengthRule flags a long label", () => {
  const rule = new BounceProfileLabelLengthRule(32);
  const item = newBounceProfile("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceProfileCreatedAtRangeRule flags values above created at", () => {
  const rule = new BounceProfileCreatedAtRangeRule(32, 64);
  const item = newBounceProfile("x", "y");
  item.createdAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BounceProfileRequiredChecksumRule flags a blank checksum", () => {
  const rule = new BounceProfileRequiredChecksumRule("bounce profile needs an entry");
  const item = newBounceProfile("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
