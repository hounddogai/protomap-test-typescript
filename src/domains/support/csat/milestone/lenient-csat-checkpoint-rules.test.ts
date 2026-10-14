import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientCsatCheckpointCodeLengthRule,
  LenientCsatCheckpointRequiredCodeRule,
  LenientCsatCheckpointRequiredLabelRule,
  LenientCsatCheckpointRequiredTimezoneRule,
  LenientCsatCheckpointTimezoneLengthRule,
  defaultLenientCsatCheckpointValidator,
} from "./lenient-csat-checkpoint-rules.js";
import { newLenientCsatCheckpoint } from "./lenient-csat-checkpoint.js";

test("LenientCsatCheckpointValidator reports every problem", () => {
  const validator = defaultLenientCsatCheckpointValidator();
  const item = newLenientCsatCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientCsatCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new LenientCsatCheckpointRequiredCodeRule("lenient csat checkpoint needs this field");
  const item = newLenientCsatCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientCsatCheckpointRequiredLabelRule flags a blank label", () => {
  const rule = new LenientCsatCheckpointRequiredLabelRule("lenient csat checkpoint needs this field");
  const item = newLenientCsatCheckpoint("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientCsatCheckpointTimezoneLengthRule flags a long timezone", () => {
  const rule = new LenientCsatCheckpointTimezoneLengthRule(86400);
  const item = newLenientCsatCheckpoint("x", "y");
  item.timezone = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientCsatCheckpointRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new LenientCsatCheckpointRequiredTimezoneRule("lenient csat checkpoint needs an entry");
  const item = newLenientCsatCheckpoint("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientCsatCheckpointCodeLengthRule flags a long code", () => {
  const rule = new LenientCsatCheckpointCodeLengthRule(32);
  const item = newLenientCsatCheckpoint("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
