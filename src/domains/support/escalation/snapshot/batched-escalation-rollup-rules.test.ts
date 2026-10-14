import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedEscalationRollupRequiredExternalRefRule,
  BatchedEscalationRollupRequiredOwnerIdRule,
  defaultBatchedEscalationRollupValidator,
} from "./batched-escalation-rollup-rules.js";
import { newBatchedEscalationRollup } from "./batched-escalation-rollup.js";

test("BatchedEscalationRollupValidator reports every problem", () => {
  const validator = defaultBatchedEscalationRollupValidator();
  const item = newBatchedEscalationRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedEscalationRollupRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new BatchedEscalationRollupRequiredExternalRefRule("batched escalation rollup needs this field");
  const item = newBatchedEscalationRollup("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedEscalationRollupRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new BatchedEscalationRollupRequiredOwnerIdRule("batched escalation rollup needs this field");
  const item = newBatchedEscalationRollup("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
