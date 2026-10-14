import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientQueuePolicy } from "./lenient-queue-policy.js";

test("LenientQueuePolicy starts in proposed", () => {
  const item = newLenientQueuePolicy("code-744", "name-691");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientQueuePolicy moves to approved", () => {
  const item = newLenientQueuePolicy("code-744", "name-691");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LenientQueuePolicy rejects moves from withdrawn", () => {
  const item = newLenientQueuePolicy("code-744", "name-691");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
