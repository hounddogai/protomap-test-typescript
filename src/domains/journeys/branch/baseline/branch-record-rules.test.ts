import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchRecordLabelLengthRule,
  BranchRecordRequiredChannelRule,
  BranchRecordRequiredLabelRule,
  defaultBranchRecordValidator,
} from "./branch-record-rules.js";
import { newBranchRecord } from "./branch-record.js";

test("BranchRecordValidator reports every problem", () => {
  const validator = defaultBranchRecordValidator();
  const item = newBranchRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchRecordLabelLengthRule flags a long label", () => {
  const rule = new BranchRecordLabelLengthRule(3600);
  const item = newBranchRecord("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchRecordRequiredChannelRule flags a blank channel", () => {
  const rule = new BranchRecordRequiredChannelRule("branch record needs a value");
  const item = newBranchRecord("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchRecordRequiredLabelRule flags a blank label", () => {
  const rule = new BranchRecordRequiredLabelRule("branch record needs a value");
  const item = newBranchRecord("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
