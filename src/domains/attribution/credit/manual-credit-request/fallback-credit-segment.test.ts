import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackCreditSegment } from "./fallback-credit-segment.js";

test("FallbackCreditSegment starts in idle", () => {
  const item = newFallbackCreditSegment("code-913", "label-377");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackCreditSegment moves to warming", () => {
  const item = newFallbackCreditSegment("code-913", "label-377");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("FallbackCreditSegment rejects moves from stopped", () => {
  const item = newFallbackCreditSegment("code-913", "label-377");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
