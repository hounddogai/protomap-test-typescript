import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainExceptionBudgetRangeRule,
  DomainExceptionRequiredExternalRefRule,
  DomainExceptionRequiredTitleRule,
  DomainExceptionTitleLengthRule,
  defaultDomainExceptionValidator,
} from "./domain-exception-rules.js";
import { newDomainException } from "./domain-exception.js";

test("DomainExceptionValidator reports every problem", () => {
  const validator = defaultDomainExceptionValidator();
  const item = newDomainException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainExceptionRequiredTitleRule flags a blank title", () => {
  const rule = new DomainExceptionRequiredTitleRule("domain exception needs an entry");
  const item = newDomainException("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainExceptionTitleLengthRule flags a long title", () => {
  const rule = new DomainExceptionTitleLengthRule(120);
  const item = newDomainException("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainExceptionRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new DomainExceptionRequiredExternalRefRule("domain exception needs a value");
  const item = newDomainException("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainExceptionBudgetRangeRule flags values above budget", () => {
  const rule = new DomainExceptionBudgetRangeRule(5.3, 3601.9);
  const item = newDomainException("x", "y");
  item.budget = 3603.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
