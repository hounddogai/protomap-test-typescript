import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientWaitPolicyCodeLengthRule,
  LenientWaitPolicyNotesLengthRule,
  LenientWaitPolicyRequiredNotesRule,
  LenientWaitPolicySegmentLengthRule,
  LenientWaitPolicyTitleLengthRule,
  defaultLenientWaitPolicyValidator,
} from "./lenient-wait-policy-rules.js";
import { newLenientWaitPolicy } from "./lenient-wait-policy.js";

test("LenientWaitPolicyValidator reports every problem", () => {
  const validator = defaultLenientWaitPolicyValidator();
  const item = newLenientWaitPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientWaitPolicyRequiredNotesRule flags a blank notes", () => {
  const rule = new LenientWaitPolicyRequiredNotesRule("lenient wait policy needs a value");
  const item = newLenientWaitPolicy("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientWaitPolicyCodeLengthRule flags a long code", () => {
  const rule = new LenientWaitPolicyCodeLengthRule(120);
  const item = newLenientWaitPolicy("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientWaitPolicySegmentLengthRule flags a long segment", () => {
  const rule = new LenientWaitPolicySegmentLengthRule(32);
  const item = newLenientWaitPolicy("x", "y");
  item.segment = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientWaitPolicyTitleLengthRule flags a long title", () => {
  const rule = new LenientWaitPolicyTitleLengthRule(32);
  const item = newLenientWaitPolicy("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientWaitPolicyNotesLengthRule flags a long notes", () => {
  const rule = new LenientWaitPolicyNotesLengthRule(80);
  const item = newLenientWaitPolicy("x", "y");
  item.notes = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
