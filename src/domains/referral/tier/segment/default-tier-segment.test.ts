import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultTierSegment } from "./default-tier-segment.js";

test("DefaultTierSegment starts in idle", () => {
  const item = newDefaultTierSegment("code-38", "label-149");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultTierSegment moves to warming", () => {
  const item = newDefaultTierSegment("code-38", "label-149");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("DefaultTierSegment rejects moves from stopped", () => {
  const item = newDefaultTierSegment("code-38", "label-149");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
