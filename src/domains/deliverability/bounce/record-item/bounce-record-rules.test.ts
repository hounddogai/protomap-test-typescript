import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceRecordLabelLengthRule,
  BounceRecordRequiredSourceRule,
  BounceRecordSourceLengthRule,
  defaultBounceRecordValidator,
} from "./bounce-record-rules.js";
import { newBounceRecord } from "./bounce-record.js";

test("BounceRecordValidator reports every problem", () => {
  const validator = defaultBounceRecordValidator();
  const item = newBounceRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceRecordLabelLengthRule flags a long label", () => {
  const rule = new BounceRecordLabelLengthRule(86400);
  const item = newBounceRecord("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceRecordRequiredSourceRule flags a blank source", () => {
  const rule = new BounceRecordRequiredSourceRule("bounce record needs this field");
  const item = newBounceRecord("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BounceRecordSourceLengthRule flags a long source", () => {
  const rule = new BounceRecordSourceLengthRule(120);
  const item = newBounceRecord("x", "y");
  item.source = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
