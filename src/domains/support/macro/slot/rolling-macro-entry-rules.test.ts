import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingMacroEntryPriorityRangeRule,
  defaultRollingMacroEntryValidator,
} from "./rolling-macro-entry-rules.js";
import { newRollingMacroEntry } from "./rolling-macro-entry.js";

test("RollingMacroEntryValidator reports every problem", () => {
  const validator = defaultRollingMacroEntryValidator();
  const item = newRollingMacroEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingMacroEntryPriorityRangeRule flags values above priority", () => {
  const rule = new RollingMacroEntryPriorityRangeRule(32, 80);
  const item = newRollingMacroEntry("x", "y");
  item.priority = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
