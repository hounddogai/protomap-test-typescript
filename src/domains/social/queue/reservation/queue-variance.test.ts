import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueVariance } from "./queue-variance.js";

test("QueueVariance starts in proposed", () => {
  const item = newQueueVariance("code-986", "label-319");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueVariance moves to approved", () => {
  const item = newQueueVariance("code-986", "label-319");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("QueueVariance rejects moves from withdrawn", () => {
  const item = newQueueVariance("code-986", "label-319");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
