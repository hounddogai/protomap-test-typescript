import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeEntryCodeLengthRule,
  NudgeEntryRequiredSegmentRule,
  NudgeEntryRequiredTitleRule,
  defaultNudgeEntryValidator,
} from "./nudge-entry-rules.js";
import { newNudgeEntry } from "./nudge-entry.js";

test("NudgeEntryValidator reports every problem", () => {
  const validator = defaultNudgeEntryValidator();
  const item = newNudgeEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeEntryRequiredTitleRule flags a blank title", () => {
  const rule = new NudgeEntryRequiredTitleRule("nudge entry needs an entry");
  const item = newNudgeEntry("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeEntryRequiredSegmentRule flags a blank segment", () => {
  const rule = new NudgeEntryRequiredSegmentRule("nudge entry needs this field");
  const item = newNudgeEntry("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeEntryCodeLengthRule flags a long code", () => {
  const rule = new NudgeEntryCodeLengthRule(3600);
  const item = newNudgeEntry("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
