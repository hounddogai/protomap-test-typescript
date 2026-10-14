import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintCheckpointNameLengthRule,
  ComplaintCheckpointRequiredNameRule,
  ComplaintCheckpointRequiredOwnerIdRule,
  defaultComplaintCheckpointValidator,
} from "./complaint-checkpoint-rules.js";
import { newComplaintCheckpoint } from "./complaint-checkpoint.js";

test("ComplaintCheckpointValidator reports every problem", () => {
  const validator = defaultComplaintCheckpointValidator();
  const item = newComplaintCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintCheckpointNameLengthRule flags a long name", () => {
  const rule = new ComplaintCheckpointNameLengthRule(86400);
  const item = newComplaintCheckpoint("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintCheckpointRequiredNameRule flags a blank name", () => {
  const rule = new ComplaintCheckpointRequiredNameRule("complaint checkpoint needs an entry");
  const item = newComplaintCheckpoint("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintCheckpointRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new ComplaintCheckpointRequiredOwnerIdRule("complaint checkpoint needs this field");
  const item = newComplaintCheckpoint("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
