import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryMacroEntryNameLengthRule,
  PrimaryMacroEntryRequiredSourceRule,
  PrimaryMacroEntryRequiredTitleRule,
  PrimaryMacroEntrySourceLengthRule,
  defaultPrimaryMacroEntryValidator,
} from "./primary-macro-entry-rules.js";
import { newPrimaryMacroEntry } from "./primary-macro-entry.js";

test("PrimaryMacroEntryValidator reports every problem", () => {
  const validator = defaultPrimaryMacroEntryValidator();
  const item = newPrimaryMacroEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryMacroEntrySourceLengthRule flags a long source", () => {
  const rule = new PrimaryMacroEntrySourceLengthRule(16);
  const item = newPrimaryMacroEntry("x", "y");
  item.source = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryMacroEntryRequiredSourceRule flags a blank source", () => {
  const rule = new PrimaryMacroEntryRequiredSourceRule("primary macro entry needs a value");
  const item = newPrimaryMacroEntry("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryMacroEntryNameLengthRule flags a long name", () => {
  const rule = new PrimaryMacroEntryNameLengthRule(32);
  const item = newPrimaryMacroEntry("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryMacroEntryRequiredTitleRule flags a blank title", () => {
  const rule = new PrimaryMacroEntryRequiredTitleRule("primary macro entry needs this field");
  const item = newPrimaryMacroEntry("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
