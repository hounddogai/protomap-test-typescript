import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedExitRuleMapping } from "./batched-exit-rule-mapping.js";

test("BatchedExitRuleMapping starts in created", () => {
  const item = newBatchedExitRuleMapping("code-523", "label-906");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedExitRuleMapping moves to validated", () => {
  const item = newBatchedExitRuleMapping("code-523", "label-906");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("BatchedExitRuleMapping rejects moves from retired", () => {
  const item = newBatchedExitRuleMapping("code-523", "label-906");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
