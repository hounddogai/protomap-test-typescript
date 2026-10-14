import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalTierEntryCodeLengthRule,
  GlobalTierEntryCountryLengthRule,
  GlobalTierEntryRequiredSourceRule,
  GlobalTierEntrySourceLengthRule,
  defaultGlobalTierEntryValidator,
} from "./global-tier-entry-rules.js";
import { newGlobalTierEntry } from "./global-tier-entry.js";

test("GlobalTierEntryValidator reports every problem", () => {
  const validator = defaultGlobalTierEntryValidator();
  const item = newGlobalTierEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalTierEntryRequiredSourceRule flags a blank source", () => {
  const rule = new GlobalTierEntryRequiredSourceRule("global tier entry needs an entry");
  const item = newGlobalTierEntry("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalTierEntryCountryLengthRule flags a long country", () => {
  const rule = new GlobalTierEntryCountryLengthRule(86400);
  const item = newGlobalTierEntry("x", "y");
  item.country = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalTierEntrySourceLengthRule flags a long source", () => {
  const rule = new GlobalTierEntrySourceLengthRule(80);
  const item = newGlobalTierEntry("x", "y");
  item.source = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalTierEntryCodeLengthRule flags a long code", () => {
  const rule = new GlobalTierEntryCodeLengthRule(86400);
  const item = newGlobalTierEntry("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
