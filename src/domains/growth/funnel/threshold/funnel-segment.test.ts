import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelSegment } from "./funnel-segment.js";

test("FunnelSegment starts in proposed", () => {
  const item = newFunnelSegment("code-38", "label-907");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelSegment moves to rejected", () => {
  const item = newFunnelSegment("code-38", "label-907");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("FunnelSegment rejects moves from withdrawn", () => {
  const item = newFunnelSegment("code-38", "label-907");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
