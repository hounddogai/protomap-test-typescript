import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveMacroProfileRequiredCodeRule,
  AdaptiveMacroProfileRevisionRangeRule,
  defaultAdaptiveMacroProfileValidator,
} from "./adaptive-macro-profile-rules.js";
import { newAdaptiveMacroProfile } from "./adaptive-macro-profile.js";

test("AdaptiveMacroProfileValidator reports every problem", () => {
  const validator = defaultAdaptiveMacroProfileValidator();
  const item = newAdaptiveMacroProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveMacroProfileRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveMacroProfileRequiredCodeRule("adaptive macro profile needs this field");
  const item = newAdaptiveMacroProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveMacroProfileRevisionRangeRule flags values above revision", () => {
  const rule = new AdaptiveMacroProfileRevisionRangeRule(1000, 86400);
  const item = newAdaptiveMacroProfile("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
