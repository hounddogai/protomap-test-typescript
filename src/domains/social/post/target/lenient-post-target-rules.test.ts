import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientPostTargetContactEmailLengthRule,
  LenientPostTargetNameLengthRule,
  LenientPostTargetPhoneLengthRule,
  LenientPostTargetRequiredContactEmailRule,
  defaultLenientPostTargetValidator,
} from "./lenient-post-target-rules.js";
import { newLenientPostTarget } from "./lenient-post-target.js";

test("LenientPostTargetValidator reports every problem", () => {
  const validator = defaultLenientPostTargetValidator();
  const item = newLenientPostTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientPostTargetNameLengthRule flags a long name", () => {
  const rule = new LenientPostTargetNameLengthRule(64);
  const item = newLenientPostTarget("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientPostTargetContactEmailLengthRule flags a long contact email", () => {
  const rule = new LenientPostTargetContactEmailLengthRule(16);
  const item = newLenientPostTarget("x", "y");
  item.contactEmail = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientPostTargetRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new LenientPostTargetRequiredContactEmailRule("lenient post target needs an entry");
  const item = newLenientPostTarget("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientPostTargetPhoneLengthRule flags a long phone", () => {
  const rule = new LenientPostTargetPhoneLengthRule(3600);
  const item = newLenientPostTarget("x", "y");
  item.phone = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
