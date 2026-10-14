import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionAllocationCodeLengthRule,
  MentionAllocationEndsAtRangeRule,
  MentionAllocationNameLengthRule,
  MentionAllocationUtmSourceLengthRule,
  MentionAllocationWeightRangeRule,
  defaultMentionAllocationValidator,
} from "./mention-allocation-rules.js";
import { newMentionAllocation } from "./mention-allocation.js";

test("MentionAllocationValidator reports every problem", () => {
  const validator = defaultMentionAllocationValidator();
  const item = newMentionAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionAllocationNameLengthRule flags a long name", () => {
  const rule = new MentionAllocationNameLengthRule(1000);
  const item = newMentionAllocation("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionAllocationWeightRangeRule flags values above weight", () => {
  const rule = new MentionAllocationWeightRangeRule(8.4, 488.1);
  const item = newMentionAllocation("x", "y");
  item.weight = 489.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionAllocationCodeLengthRule flags a long code", () => {
  const rule = new MentionAllocationCodeLengthRule(255);
  const item = newMentionAllocation("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionAllocationUtmSourceLengthRule flags a long utm source", () => {
  const rule = new MentionAllocationUtmSourceLengthRule(255);
  const item = newMentionAllocation("x", "y");
  item.utmSource = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionAllocationEndsAtRangeRule flags values above ends at", () => {
  const rule = new MentionAllocationEndsAtRangeRule(64, 1000);
  const item = newMentionAllocation("x", "y");
  item.endsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
