import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeProfileNameLengthRule,
  NudgeProfileRequiredCodeRule,
  NudgeProfileRetriesRangeRule,
  NudgeProfileRevisionRangeRule,
  defaultNudgeProfileValidator,
} from "./nudge-profile-rules.js";
import { newNudgeProfile } from "./nudge-profile.js";

test("NudgeProfileValidator reports every problem", () => {
  const validator = defaultNudgeProfileValidator();
  const item = newNudgeProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeProfileRequiredCodeRule flags a blank code", () => {
  const rule = new NudgeProfileRequiredCodeRule("nudge profile needs a value");
  const item = newNudgeProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeProfileRevisionRangeRule flags values above revision", () => {
  const rule = new NudgeProfileRevisionRangeRule(32, 255);
  const item = newNudgeProfile("x", "y");
  item.revision = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeProfileNameLengthRule flags a long name", () => {
  const rule = new NudgeProfileNameLengthRule(3600);
  const item = newNudgeProfile("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeProfileRetriesRangeRule flags values above retries", () => {
  const rule = new NudgeProfileRetriesRangeRule(80, 120);
  const item = newNudgeProfile("x", "y");
  item.retries = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
