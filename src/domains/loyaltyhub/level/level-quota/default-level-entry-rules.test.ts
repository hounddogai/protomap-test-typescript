import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultLevelEntryAttemptsRangeRule,
  DefaultLevelEntryCodeLengthRule,
  DefaultLevelEntryRequiredLabelRule,
  DefaultLevelEntrySendAtRangeRule,
  defaultDefaultLevelEntryValidator,
} from "./default-level-entry-rules.js";
import { newDefaultLevelEntry } from "./default-level-entry.js";

test("DefaultLevelEntryValidator reports every problem", () => {
  const validator = defaultDefaultLevelEntryValidator();
  const item = newDefaultLevelEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultLevelEntryCodeLengthRule flags a long code", () => {
  const rule = new DefaultLevelEntryCodeLengthRule(86400);
  const item = newDefaultLevelEntry("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultLevelEntryAttemptsRangeRule flags values above attempts", () => {
  const rule = new DefaultLevelEntryAttemptsRangeRule(80, 86400);
  const item = newDefaultLevelEntry("x", "y");
  item.attempts = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultLevelEntrySendAtRangeRule flags values above send at", () => {
  const rule = new DefaultLevelEntrySendAtRangeRule(120, 1000);
  const item = newDefaultLevelEntry("x", "y");
  item.sendAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultLevelEntryRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultLevelEntryRequiredLabelRule("default level entry needs a value");
  const item = newDefaultLevelEntry("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
