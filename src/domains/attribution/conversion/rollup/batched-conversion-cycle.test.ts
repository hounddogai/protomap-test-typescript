import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedConversionCycle } from "./batched-conversion-cycle.js";

test("BatchedConversionCycle starts in created", () => {
  const item = newBatchedConversionCycle("code-845", "label-911");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedConversionCycle moves to retired", () => {
  const item = newBatchedConversionCycle("code-845", "label-911");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("BatchedConversionCycle rejects moves from retired", () => {
  const item = newBatchedConversionCycle("code-845", "label-911");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
