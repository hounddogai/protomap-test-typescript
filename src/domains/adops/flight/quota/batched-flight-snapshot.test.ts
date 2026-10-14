import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedFlightSnapshot } from "./batched-flight-snapshot.js";

test("BatchedFlightSnapshot starts in draft", () => {
  const item = newBatchedFlightSnapshot("code-424", "name-530");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedFlightSnapshot moves to active", () => {
  const item = newBatchedFlightSnapshot("code-424", "name-530");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("BatchedFlightSnapshot rejects moves from closed", () => {
  const item = newBatchedFlightSnapshot("code-424", "name-530");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
