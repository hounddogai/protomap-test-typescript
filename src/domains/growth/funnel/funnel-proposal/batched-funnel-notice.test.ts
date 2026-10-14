import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedFunnelNotice } from "./batched-funnel-notice.js";

test("BatchedFunnelNotice starts in planned", () => {
  const item = newBatchedFunnelNotice("code-49", "label-453");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedFunnelNotice moves to in progress", () => {
  const item = newBatchedFunnelNotice("code-49", "label-453");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("BatchedFunnelNotice rejects moves from cancelled", () => {
  const item = newBatchedFunnelNotice("code-49", "label-453");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
