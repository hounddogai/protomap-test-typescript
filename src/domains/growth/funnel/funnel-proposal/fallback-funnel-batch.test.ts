import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackFunnelBatch } from "./fallback-funnel-batch.js";

test("FallbackFunnelBatch starts in proposed", () => {
  const item = newFallbackFunnelBatch("code-490", "name-356");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackFunnelBatch moves to rejected", () => {
  const item = newFallbackFunnelBatch("code-490", "name-356");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("FallbackFunnelBatch rejects moves from withdrawn", () => {
  const item = newFallbackFunnelBatch("code-490", "name-356");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
