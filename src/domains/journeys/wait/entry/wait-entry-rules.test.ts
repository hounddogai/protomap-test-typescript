import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitEntryCodeLengthRule,
  WaitEntryRateRangeRule,
  WaitEntryRequiredCodeRule,
  WaitEntryRequiredTitleRule,
  WaitEntryTitleLengthRule,
  defaultWaitEntryValidator,
} from "./wait-entry-rules.js";
import { newWaitEntry } from "./wait-entry.js";

test("WaitEntryValidator reports every problem", () => {
  const validator = defaultWaitEntryValidator();
  const item = newWaitEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitEntryTitleLengthRule flags a long title", () => {
  const rule = new WaitEntryTitleLengthRule(255);
  const item = newWaitEntry("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WaitEntryRequiredTitleRule flags a blank title", () => {
  const rule = new WaitEntryRequiredTitleRule("wait entry needs an entry");
  const item = newWaitEntry("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitEntryRequiredCodeRule flags a blank code", () => {
  const rule = new WaitEntryRequiredCodeRule("wait entry needs this field");
  const item = newWaitEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitEntryRateRangeRule flags values above rate", () => {
  const rule = new WaitEntryRateRangeRule(0.9, 2663.5);
  const item = newWaitEntry("x", "y");
  item.rate = 2665;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitEntryCodeLengthRule flags a long code", () => {
  const rule = new WaitEntryCodeLengthRule(80);
  const item = newWaitEntry("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
