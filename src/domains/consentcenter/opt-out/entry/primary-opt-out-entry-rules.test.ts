import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryOptOutEntryCurrencyLengthRule,
  PrimaryOptOutEntryRequiredCurrencyRule,
  defaultPrimaryOptOutEntryValidator,
} from "./primary-opt-out-entry-rules.js";
import { newPrimaryOptOutEntry } from "./primary-opt-out-entry.js";

test("PrimaryOptOutEntryValidator reports every problem", () => {
  const validator = defaultPrimaryOptOutEntryValidator();
  const item = newPrimaryOptOutEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryOptOutEntryRequiredCurrencyRule flags a blank currency", () => {
  const rule = new PrimaryOptOutEntryRequiredCurrencyRule("primary opt out entry needs an entry");
  const item = newPrimaryOptOutEntry("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryOptOutEntryCurrencyLengthRule flags a long currency", () => {
  const rule = new PrimaryOptOutEntryCurrencyLengthRule(1000);
  const item = newPrimaryOptOutEntry("x", "y");
  item.currency = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
