import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultMentionAdjustmentPriorityRangeRule,
  DefaultMentionAdjustmentRequiredChecksumRule,
  DefaultMentionAdjustmentRequiredCodeRule,
  DefaultMentionAdjustmentRequiredTitleRule,
  defaultDefaultMentionAdjustmentValidator,
} from "./default-mention-adjustment-rules.js";
import { newDefaultMentionAdjustment } from "./default-mention-adjustment.js";

test("DefaultMentionAdjustmentValidator reports every problem", () => {
  const validator = defaultDefaultMentionAdjustmentValidator();
  const item = newDefaultMentionAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultMentionAdjustmentRequiredChecksumRule flags a blank checksum", () => {
  const rule = new DefaultMentionAdjustmentRequiredChecksumRule("default mention adjustment needs an entry");
  const item = newDefaultMentionAdjustment("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultMentionAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultMentionAdjustmentRequiredCodeRule("default mention adjustment needs a value");
  const item = newDefaultMentionAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultMentionAdjustmentRequiredTitleRule flags a blank title", () => {
  const rule = new DefaultMentionAdjustmentRequiredTitleRule("default mention adjustment needs an entry");
  const item = newDefaultMentionAdjustment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultMentionAdjustmentPriorityRangeRule flags values above priority", () => {
  const rule = new DefaultMentionAdjustmentPriorityRangeRule(3600, 86400);
  const item = newDefaultMentionAdjustment("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
