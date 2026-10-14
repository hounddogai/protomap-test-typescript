import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalQueueVariance } from "./global-queue-variance.js";

test("GlobalQueueVariance starts in proposed", () => {
  const item = newGlobalQueueVariance("code-599", "label-743");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalQueueVariance moves to rejected", () => {
  const item = newGlobalQueueVariance("code-599", "label-743");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("GlobalQueueVariance rejects moves from withdrawn", () => {
  const item = newGlobalQueueVariance("code-599", "label-743");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
