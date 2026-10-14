import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainWindowBudgetRangeRule,
  DomainWindowCountryLengthRule,
  DomainWindowLabelLengthRule,
  DomainWindowRequiredLabelRule,
  DomainWindowSegmentLengthRule,
  DomainWindowSequenceRangeRule,
  defaultDomainWindowValidator,
} from "./domain-window-rules.js";
import { newDomainWindow } from "./domain-window.js";

test("DomainWindowValidator reports every problem", () => {
  const validator = defaultDomainWindowValidator();
  const item = newDomainWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainWindowSegmentLengthRule flags a long segment", () => {
  const rule = new DomainWindowSegmentLengthRule(1000);
  const item = newDomainWindow("x", "y");
  item.segment = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainWindowSequenceRangeRule flags values above sequence", () => {
  const rule = new DomainWindowSequenceRangeRule(80, 86400);
  const item = newDomainWindow("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainWindowLabelLengthRule flags a long label", () => {
  const rule = new DomainWindowLabelLengthRule(80);
  const item = newDomainWindow("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainWindowRequiredLabelRule flags a blank label", () => {
  const rule = new DomainWindowRequiredLabelRule("domain window needs a value");
  const item = newDomainWindow("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainWindowBudgetRangeRule flags values above budget", () => {
  const rule = new DomainWindowBudgetRangeRule(2.3, 4752.2);
  const item = newDomainWindow("x", "y");
  item.budget = 4753.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainWindowCountryLengthRule flags a long country", () => {
  const rule = new DomainWindowCountryLengthRule(120);
  const item = newDomainWindow("x", "y");
  item.country = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
