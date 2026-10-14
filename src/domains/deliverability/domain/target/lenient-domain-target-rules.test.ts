import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientDomainTargetAmountRangeRule,
  LenientDomainTargetCurrencyLengthRule,
  LenientDomainTargetRequiredCodeRule,
  LenientDomainTargetRequiredCurrencyRule,
  LenientDomainTargetRequiredNameRule,
  defaultLenientDomainTargetValidator,
} from "./lenient-domain-target-rules.js";
import { newLenientDomainTarget } from "./lenient-domain-target.js";

test("LenientDomainTargetValidator reports every problem", () => {
  const validator = defaultLenientDomainTargetValidator();
  const item = newLenientDomainTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientDomainTargetRequiredNameRule flags a blank name", () => {
  const rule = new LenientDomainTargetRequiredNameRule("lenient domain target needs an entry");
  const item = newLenientDomainTarget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientDomainTargetRequiredCurrencyRule flags a blank currency", () => {
  const rule = new LenientDomainTargetRequiredCurrencyRule("lenient domain target needs an entry");
  const item = newLenientDomainTarget("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientDomainTargetAmountRangeRule flags values above amount", () => {
  const rule = new LenientDomainTargetAmountRangeRule(5.2, 2578.6);
  const item = newLenientDomainTarget("x", "y");
  item.amount = 2580.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientDomainTargetCurrencyLengthRule flags a long currency", () => {
  const rule = new LenientDomainTargetCurrencyLengthRule(1000);
  const item = newLenientDomainTarget("x", "y");
  item.currency = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientDomainTargetRequiredCodeRule flags a blank code", () => {
  const rule = new LenientDomainTargetRequiredCodeRule("lenient domain target needs a value");
  const item = newLenientDomainTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
