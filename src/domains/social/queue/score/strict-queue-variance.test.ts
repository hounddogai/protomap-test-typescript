import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictQueueVariance } from "./strict-queue-variance.js";

test("StrictQueueVariance starts in planned", () => {
  const item = newStrictQueueVariance("code-902", "name-372");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictQueueVariance moves to scheduled", () => {
  const item = newStrictQueueVariance("code-902", "name-372");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("StrictQueueVariance rejects moves from cancelled", () => {
  const item = newStrictQueueVariance("code-902", "name-372");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
