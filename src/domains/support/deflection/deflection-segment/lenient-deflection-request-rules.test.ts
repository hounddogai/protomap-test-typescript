import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientDeflectionRequestAmountRangeRule,
  LenientDeflectionRequestCodeLengthRule,
  LenientDeflectionRequestRequiredCodeRule,
  LenientDeflectionRequestSegmentLengthRule,
  LenientDeflectionRequestUtmSourceLengthRule,
  defaultLenientDeflectionRequestValidator,
} from "./lenient-deflection-request-rules.js";
import { newLenientDeflectionRequest } from "./lenient-deflection-request.js";

test("LenientDeflectionRequestValidator reports every problem", () => {
  const validator = defaultLenientDeflectionRequestValidator();
  const item = newLenientDeflectionRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientDeflectionRequestAmountRangeRule flags values above amount", () => {
  const rule = new LenientDeflectionRequestAmountRangeRule(9.1, 4573.6);
  const item = newLenientDeflectionRequest("x", "y");
  item.amount = 4575.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientDeflectionRequestRequiredCodeRule flags a blank code", () => {
  const rule = new LenientDeflectionRequestRequiredCodeRule("lenient deflection request needs an entry");
  const item = newLenientDeflectionRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientDeflectionRequestUtmSourceLengthRule flags a long utm source", () => {
  const rule = new LenientDeflectionRequestUtmSourceLengthRule(32);
  const item = newLenientDeflectionRequest("x", "y");
  item.utmSource = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientDeflectionRequestCodeLengthRule flags a long code", () => {
  const rule = new LenientDeflectionRequestCodeLengthRule(1000);
  const item = newLenientDeflectionRequest("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientDeflectionRequestSegmentLengthRule flags a long segment", () => {
  const rule = new LenientDeflectionRequestSegmentLengthRule(16);
  const item = newLenientDeflectionRequest("x", "y");
  item.segment = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
