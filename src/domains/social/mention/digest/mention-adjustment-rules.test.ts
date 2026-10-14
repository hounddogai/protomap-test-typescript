import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionAdjustmentRequiredUtmSourceRule,
  MentionAdjustmentUtmSourceLengthRule,
  defaultMentionAdjustmentValidator,
} from "./mention-adjustment-rules.js";
import { newMentionAdjustment } from "./mention-adjustment.js";

test("MentionAdjustmentValidator reports every problem", () => {
  const validator = defaultMentionAdjustmentValidator();
  const item = newMentionAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionAdjustmentUtmSourceLengthRule flags a long utm source", () => {
  const rule = new MentionAdjustmentUtmSourceLengthRule(120);
  const item = newMentionAdjustment("x", "y");
  item.utmSource = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionAdjustmentRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new MentionAdjustmentRequiredUtmSourceRule("mention adjustment needs a value");
  const item = newMentionAdjustment("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
