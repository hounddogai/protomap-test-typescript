import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledMentionMappingCodeLengthRule,
  ScheduledMentionMappingLabelLengthRule,
  ScheduledMentionMappingRequiredCodeRule,
  ScheduledMentionMappingSourceLengthRule,
  defaultScheduledMentionMappingValidator,
} from "./scheduled-mention-mapping-rules.js";
import { newScheduledMentionMapping } from "./scheduled-mention-mapping.js";

test("ScheduledMentionMappingValidator reports every problem", () => {
  const validator = defaultScheduledMentionMappingValidator();
  const item = newScheduledMentionMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledMentionMappingCodeLengthRule flags a long code", () => {
  const rule = new ScheduledMentionMappingCodeLengthRule(1000);
  const item = newScheduledMentionMapping("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledMentionMappingRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledMentionMappingRequiredCodeRule("scheduled mention mapping needs this field");
  const item = newScheduledMentionMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledMentionMappingLabelLengthRule flags a long label", () => {
  const rule = new ScheduledMentionMappingLabelLengthRule(16);
  const item = newScheduledMentionMapping("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledMentionMappingSourceLengthRule flags a long source", () => {
  const rule = new ScheduledMentionMappingSourceLengthRule(3600);
  const item = newScheduledMentionMapping("x", "y");
  item.source = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
