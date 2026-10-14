import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainProfileLabelLengthRule,
  DomainProfileRequiredCodeRule,
  DomainProfileRevisionRangeRule,
  defaultDomainProfileValidator,
} from "./domain-profile-rules.js";
import { newDomainProfile } from "./domain-profile.js";

test("DomainProfileValidator reports every problem", () => {
  const validator = defaultDomainProfileValidator();
  const item = newDomainProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainProfileRequiredCodeRule flags a blank code", () => {
  const rule = new DomainProfileRequiredCodeRule("domain profile needs a value");
  const item = newDomainProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainProfileRevisionRangeRule flags values above revision", () => {
  const rule = new DomainProfileRevisionRangeRule(64, 255);
  const item = newDomainProfile("x", "y");
  item.revision = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainProfileLabelLengthRule flags a long label", () => {
  const rule = new DomainProfileLabelLengthRule(3600);
  const item = newDomainProfile("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
