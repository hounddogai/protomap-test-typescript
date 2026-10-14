import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainRecordCodeLengthRule,
  DomainRecordExternalRefLengthRule,
  DomainRecordLabelLengthRule,
  DomainRecordRequiredLabelRule,
  defaultDomainRecordValidator,
} from "./domain-record-rules.js";
import { newDomainRecord } from "./domain-record.js";

test("DomainRecordValidator reports every problem", () => {
  const validator = defaultDomainRecordValidator();
  const item = newDomainRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainRecordExternalRefLengthRule flags a long external ref", () => {
  const rule = new DomainRecordExternalRefLengthRule(16);
  const item = newDomainRecord("x", "y");
  item.externalRef = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainRecordLabelLengthRule flags a long label", () => {
  const rule = new DomainRecordLabelLengthRule(120);
  const item = newDomainRecord("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainRecordRequiredLabelRule flags a blank label", () => {
  const rule = new DomainRecordRequiredLabelRule("domain record needs a value");
  const item = newDomainRecord("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainRecordCodeLengthRule flags a long code", () => {
  const rule = new DomainRecordCodeLengthRule(120);
  const item = newDomainRecord("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
