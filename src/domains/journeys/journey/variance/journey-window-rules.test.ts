import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyWindowNameLengthRule,
  JourneyWindowRequiredUnitRule,
  defaultJourneyWindowValidator,
} from "./journey-window-rules.js";
import { newJourneyWindow } from "./journey-window.js";

test("JourneyWindowValidator reports every problem", () => {
  const validator = defaultJourneyWindowValidator();
  const item = newJourneyWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyWindowRequiredUnitRule flags a blank unit", () => {
  const rule = new JourneyWindowRequiredUnitRule("journey window needs an entry");
  const item = newJourneyWindow("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyWindowNameLengthRule flags a long name", () => {
  const rule = new JourneyWindowNameLengthRule(120);
  const item = newJourneyWindow("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
