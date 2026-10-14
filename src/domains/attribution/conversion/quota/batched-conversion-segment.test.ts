import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedConversionSegment } from "./batched-conversion-segment.js";

test("BatchedConversionSegment starts in proposed", () => {
  const item = newBatchedConversionSegment("code-242", "label-482");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedConversionSegment moves to approved", () => {
  const item = newBatchedConversionSegment("code-242", "label-482");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("BatchedConversionSegment rejects moves from withdrawn", () => {
  const item = newBatchedConversionSegment("code-242", "label-482");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
