import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientSenderSegment } from "./lenient-sender-segment.js";

test("LenientSenderSegment starts in planned", () => {
  const item = newLenientSenderSegment("code-617", "name-283");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientSenderSegment moves to completed", () => {
  const item = newLenientSenderSegment("code-617", "name-283");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("LenientSenderSegment rejects moves from cancelled", () => {
  const item = newLenientSenderSegment("code-617", "name-283");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
