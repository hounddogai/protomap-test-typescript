import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierSegment } from "./tier-segment.js";

test("TierSegment starts in new", () => {
  const item = newTierSegment("code-713", "title-932");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierSegment moves to queued", () => {
  const item = newTierSegment("code-713", "title-932");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("TierSegment rejects moves from failed", () => {
  const item = newTierSegment("code-713", "title-932");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
