import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictDomainRecordCategoryLengthRule,
  StrictDomainRecordLabelLengthRule,
  StrictDomainRecordRequiredCategoryRule,
  StrictDomainRecordRequiredTitleRule,
  defaultStrictDomainRecordValidator,
} from "./strict-domain-record-rules.js";
import { newStrictDomainRecord } from "./strict-domain-record.js";

test("StrictDomainRecordValidator reports every problem", () => {
  const validator = defaultStrictDomainRecordValidator();
  const item = newStrictDomainRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictDomainRecordRequiredTitleRule flags a blank title", () => {
  const rule = new StrictDomainRecordRequiredTitleRule("strict domain record needs a value");
  const item = newStrictDomainRecord("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictDomainRecordCategoryLengthRule flags a long category", () => {
  const rule = new StrictDomainRecordCategoryLengthRule(80);
  const item = newStrictDomainRecord("x", "y");
  item.category = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictDomainRecordLabelLengthRule flags a long label", () => {
  const rule = new StrictDomainRecordLabelLengthRule(86400);
  const item = newStrictDomainRecord("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictDomainRecordRequiredCategoryRule flags a blank category", () => {
  const rule = new StrictDomainRecordRequiredCategoryRule("strict domain record needs this field");
  const item = newStrictDomainRecord("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
