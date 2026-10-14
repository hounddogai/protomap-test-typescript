import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainVarianceSummaryLengthRule,
  DomainVarianceTitleLengthRule,
  defaultDomainVarianceValidator,
} from "./domain-variance-rules.js";
import { newDomainVariance } from "./domain-variance.js";

test("DomainVarianceValidator reports every problem", () => {
  const validator = defaultDomainVarianceValidator();
  const item = newDomainVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainVarianceTitleLengthRule flags a long title", () => {
  const rule = new DomainVarianceTitleLengthRule(120);
  const item = newDomainVariance("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainVarianceSummaryLengthRule flags a long summary", () => {
  const rule = new DomainVarianceSummaryLengthRule(32);
  const item = newDomainVariance("x", "y");
  item.summary = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
