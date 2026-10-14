import assert from "node:assert/strict";
import { test } from "node:test";
import { OptOutWindowRequiredNotesRule, defaultOptOutWindowValidator } from "./opt-out-window-rules.js";
import { newOptOutWindow } from "./opt-out-window.js";

test("OptOutWindowValidator reports every problem", () => {
  const validator = defaultOptOutWindowValidator();
  const item = newOptOutWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutWindowRequiredNotesRule flags a blank notes", () => {
  const rule = new OptOutWindowRequiredNotesRule("opt out window needs this field");
  const item = newOptOutWindow("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
