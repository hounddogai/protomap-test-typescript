import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceSegment } from "./bounce-segment.js";

test("BounceSegment starts in planned", () => {
  const item = newBounceSegment("code-868", "name-780");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceSegment moves to completed", () => {
  const item = newBounceSegment("code-868", "name-780");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("BounceSegment rejects moves from cancelled", () => {
  const item = newBounceSegment("code-868", "name-780");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
