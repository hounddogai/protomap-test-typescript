import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingQueueVariance } from "./rolling-queue-variance.js";

test("RollingQueueVariance starts in proposed", () => {
  const item = newRollingQueueVariance("code-885", "label-664");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingQueueVariance moves to withdrawn", () => {
  const item = newRollingQueueVariance("code-885", "label-664");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("RollingQueueVariance rejects moves from withdrawn", () => {
  const item = newRollingQueueVariance("code-885", "label-664");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
