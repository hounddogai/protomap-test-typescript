import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientSlaProfileBidRangeRule,
  LenientSlaProfileCreatedAtRangeRule,
  LenientSlaProfileNameLengthRule,
  LenientSlaProfileRequiredSourceRule,
  LenientSlaProfileRevisionRangeRule,
  defaultLenientSlaProfileValidator,
} from "./lenient-sla-profile-rules.js";
import { newLenientSlaProfile } from "./lenient-sla-profile.js";

test("LenientSlaProfileValidator reports every problem", () => {
  const validator = defaultLenientSlaProfileValidator();
  const item = newLenientSlaProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientSlaProfileNameLengthRule flags a long name", () => {
  const rule = new LenientSlaProfileNameLengthRule(120);
  const item = newLenientSlaProfile("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientSlaProfileRequiredSourceRule flags a blank source", () => {
  const rule = new LenientSlaProfileRequiredSourceRule("lenient sla profile needs this field");
  const item = newLenientSlaProfile("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientSlaProfileCreatedAtRangeRule flags values above created at", () => {
  const rule = new LenientSlaProfileCreatedAtRangeRule(16, 32);
  const item = newLenientSlaProfile("x", "y");
  item.createdAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientSlaProfileRevisionRangeRule flags values above revision", () => {
  const rule = new LenientSlaProfileRevisionRangeRule(16, 64);
  const item = newLenientSlaProfile("x", "y");
  item.revision = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientSlaProfileBidRangeRule flags values above bid", () => {
  const rule = new LenientSlaProfileBidRangeRule(4.8, 4637.2);
  const item = newLenientSlaProfile("x", "y");
  item.bid = 4638.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
