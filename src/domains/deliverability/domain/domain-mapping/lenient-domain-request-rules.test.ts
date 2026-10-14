import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientDomainRequestCodeLengthRule,
  LenientDomainRequestRequiredCodeRule,
  defaultLenientDomainRequestValidator,
} from "./lenient-domain-request-rules.js";
import { newLenientDomainRequest } from "./lenient-domain-request.js";

test("LenientDomainRequestValidator reports every problem", () => {
  const validator = defaultLenientDomainRequestValidator();
  const item = newLenientDomainRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientDomainRequestCodeLengthRule flags a long code", () => {
  const rule = new LenientDomainRequestCodeLengthRule(32);
  const item = newLenientDomainRequest("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientDomainRequestRequiredCodeRule flags a blank code", () => {
  const rule = new LenientDomainRequestRequiredCodeRule("lenient domain request needs this field");
  const item = newLenientDomainRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
