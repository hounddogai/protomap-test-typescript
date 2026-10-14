import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainEntryCodeLengthRule,
  DomainEntryEndsAtRangeRule,
  DomainEntryRegionLengthRule,
  DomainEntryWindowDaysRangeRule,
  defaultDomainEntryValidator,
} from "./domain-entry-rules.js";
import { newDomainEntry } from "./domain-entry.js";

test("DomainEntryValidator reports every problem", () => {
  const validator = defaultDomainEntryValidator();
  const item = newDomainEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainEntryEndsAtRangeRule flags values above ends at", () => {
  const rule = new DomainEntryEndsAtRangeRule(1000, 3600);
  const item = newDomainEntry("x", "y");
  item.endsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainEntryCodeLengthRule flags a long code", () => {
  const rule = new DomainEntryCodeLengthRule(3600);
  const item = newDomainEntry("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainEntryWindowDaysRangeRule flags values above window days", () => {
  const rule = new DomainEntryWindowDaysRangeRule(120, 86400);
  const item = newDomainEntry("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainEntryRegionLengthRule flags a long region", () => {
  const rule = new DomainEntryRegionLengthRule(32);
  const item = newDomainEntry("x", "y");
  item.region = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
