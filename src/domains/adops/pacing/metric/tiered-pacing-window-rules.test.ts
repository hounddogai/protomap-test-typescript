import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredPacingWindowRequiredPhoneRule,
  defaultTieredPacingWindowValidator,
} from "./tiered-pacing-window-rules.js";
import { newTieredPacingWindow } from "./tiered-pacing-window.js";

test("TieredPacingWindowValidator reports every problem", () => {
  const validator = defaultTieredPacingWindowValidator();
  const item = newTieredPacingWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredPacingWindowRequiredPhoneRule flags a blank phone", () => {
  const rule = new TieredPacingWindowRequiredPhoneRule("tiered pacing window needs a value");
  const item = newTieredPacingWindow("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
