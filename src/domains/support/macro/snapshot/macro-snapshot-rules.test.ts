import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroSnapshotOwnerIdLengthRule,
  MacroSnapshotRequiredTitleRule,
  defaultMacroSnapshotValidator,
} from "./macro-snapshot-rules.js";
import { newMacroSnapshot } from "./macro-snapshot.js";

test("MacroSnapshotValidator reports every problem", () => {
  const validator = defaultMacroSnapshotValidator();
  const item = newMacroSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroSnapshotOwnerIdLengthRule flags a long owner id", () => {
  const rule = new MacroSnapshotOwnerIdLengthRule(16);
  const item = newMacroSnapshot("x", "y");
  item.ownerId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroSnapshotRequiredTitleRule flags a blank title", () => {
  const rule = new MacroSnapshotRequiredTitleRule("macro snapshot needs a value");
  const item = newMacroSnapshot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
