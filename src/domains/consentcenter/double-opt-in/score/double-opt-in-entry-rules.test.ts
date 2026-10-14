import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInEntryLocaleLengthRule,
  DoubleOptInEntryNameLengthRule,
  DoubleOptInEntryRequiredLocaleRule,
  DoubleOptInEntryRequiredNameRule,
  defaultDoubleOptInEntryValidator,
} from "./double-opt-in-entry-rules.js";
import { newDoubleOptInEntry } from "./double-opt-in-entry.js";

test("DoubleOptInEntryValidator reports every problem", () => {
  const validator = defaultDoubleOptInEntryValidator();
  const item = newDoubleOptInEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInEntryLocaleLengthRule flags a long locale", () => {
  const rule = new DoubleOptInEntryLocaleLengthRule(64);
  const item = newDoubleOptInEntry("x", "y");
  item.locale = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInEntryNameLengthRule flags a long name", () => {
  const rule = new DoubleOptInEntryNameLengthRule(255);
  const item = newDoubleOptInEntry("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInEntryRequiredNameRule flags a blank name", () => {
  const rule = new DoubleOptInEntryRequiredNameRule("double opt in entry needs this field");
  const item = newDoubleOptInEntry("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInEntryRequiredLocaleRule flags a blank locale", () => {
  const rule = new DoubleOptInEntryRequiredLocaleRule("double opt in entry needs a value");
  const item = newDoubleOptInEntry("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
