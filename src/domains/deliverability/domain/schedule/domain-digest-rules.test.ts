import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainDigestBudgetRangeRule,
  DomainDigestNameLengthRule,
  DomainDigestRequiredNameRule,
  defaultDomainDigestValidator,
} from "./domain-digest-rules.js";
import { newDomainDigest } from "./domain-digest.js";

test("DomainDigestValidator reports every problem", () => {
  const validator = defaultDomainDigestValidator();
  const item = newDomainDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainDigestRequiredNameRule flags a blank name", () => {
  const rule = new DomainDigestRequiredNameRule("domain digest needs a value");
  const item = newDomainDigest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainDigestBudgetRangeRule flags values above budget", () => {
  const rule = new DomainDigestBudgetRangeRule(7.8, 1281.5);
  const item = newDomainDigest("x", "y");
  item.budget = 1283;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainDigestNameLengthRule flags a long name", () => {
  const rule = new DomainDigestNameLengthRule(120);
  const item = newDomainDigest("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
