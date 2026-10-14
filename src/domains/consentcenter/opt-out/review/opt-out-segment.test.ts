import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutSegment } from "./opt-out-segment.js";

test("OptOutSegment starts in new", () => {
  const item = newOptOutSegment("code-26", "title-157");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutSegment moves to queued", () => {
  const item = newOptOutSegment("code-26", "title-157");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("OptOutSegment rejects moves from failed", () => {
  const item = newOptOutSegment("code-26", "title-157");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
