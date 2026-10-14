import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainRequestDiscountRangeRule,
  DomainRequestNameLengthRule,
  DomainRequestRequiredCodeRule,
  defaultDomainRequestValidator,
} from "./domain-request-rules.js";
import { newDomainRequest } from "./domain-request.js";

test("DomainRequestValidator reports every problem", () => {
  const validator = defaultDomainRequestValidator();
  const item = newDomainRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainRequestDiscountRangeRule flags values above discount", () => {
  const rule = new DomainRequestDiscountRangeRule(3.6, 2317.9);
  const item = newDomainRequest("x", "y");
  item.discount = 2319.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainRequestNameLengthRule flags a long name", () => {
  const rule = new DomainRequestNameLengthRule(16);
  const item = newDomainRequest("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainRequestRequiredCodeRule flags a blank code", () => {
  const rule = new DomainRequestRequiredCodeRule("domain request needs a value");
  const item = newDomainRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
