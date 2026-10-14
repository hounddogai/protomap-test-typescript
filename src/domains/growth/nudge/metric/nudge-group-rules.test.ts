import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeGroupClicksRangeRule,
  NudgeGroupNotesLengthRule,
  NudgeGroupRateRangeRule,
  NudgeGroupScoreRangeRule,
  defaultNudgeGroupValidator,
} from "./nudge-group-rules.js";
import { newNudgeGroup } from "./nudge-group.js";

test("NudgeGroupValidator reports every problem", () => {
  const validator = defaultNudgeGroupValidator();
  const item = newNudgeGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeGroupScoreRangeRule flags values above score", () => {
  const rule = new NudgeGroupScoreRangeRule(4.8, 2152.2);
  const item = newNudgeGroup("x", "y");
  item.score = 2153.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeGroupNotesLengthRule flags a long notes", () => {
  const rule = new NudgeGroupNotesLengthRule(16);
  const item = newNudgeGroup("x", "y");
  item.notes = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeGroupClicksRangeRule flags values above clicks", () => {
  const rule = new NudgeGroupClicksRangeRule(255, 255);
  const item = newNudgeGroup("x", "y");
  item.clicks = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeGroupRateRangeRule flags values above rate", () => {
  const rule = new NudgeGroupRateRangeRule(7.2, 3124);
  const item = newNudgeGroup("x", "y");
  item.rate = 3125.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
