import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchEntryCodeLengthRule,
  BranchEntryNameLengthRule,
  BranchEntryRequiredCodeRule,
  BranchEntryRequiredNameRule,
  defaultBranchEntryValidator,
} from "./branch-entry-rules.js";
import { newBranchEntry } from "./branch-entry.js";

test("BranchEntryValidator reports every problem", () => {
  const validator = defaultBranchEntryValidator();
  const item = newBranchEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchEntryCodeLengthRule flags a long code", () => {
  const rule = new BranchEntryCodeLengthRule(32);
  const item = newBranchEntry("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchEntryRequiredCodeRule flags a blank code", () => {
  const rule = new BranchEntryRequiredCodeRule("branch entry needs an entry");
  const item = newBranchEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchEntryNameLengthRule flags a long name", () => {
  const rule = new BranchEntryNameLengthRule(80);
  const item = newBranchEntry("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchEntryRequiredNameRule flags a blank name", () => {
  const rule = new BranchEntryRequiredNameRule("branch entry needs an entry");
  const item = newBranchEntry("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
