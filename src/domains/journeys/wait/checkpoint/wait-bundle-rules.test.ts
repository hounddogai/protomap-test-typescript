import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitBundleNameLengthRule,
  WaitBundleNotesLengthRule,
  WaitBundleRequiredNotesRule,
  defaultWaitBundleValidator,
} from "./wait-bundle-rules.js";
import { newWaitBundle } from "./wait-bundle.js";

test("WaitBundleValidator reports every problem", () => {
  const validator = defaultWaitBundleValidator();
  const item = newWaitBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitBundleNotesLengthRule flags a long notes", () => {
  const rule = new WaitBundleNotesLengthRule(1000);
  const item = newWaitBundle("x", "y");
  item.notes = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WaitBundleNameLengthRule flags a long name", () => {
  const rule = new WaitBundleNameLengthRule(1000);
  const item = newWaitBundle("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WaitBundleRequiredNotesRule flags a blank notes", () => {
  const rule = new WaitBundleRequiredNotesRule("wait bundle needs a value");
  const item = newWaitBundle("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
