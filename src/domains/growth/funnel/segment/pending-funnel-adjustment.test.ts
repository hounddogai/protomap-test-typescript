import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingFunnelAdjustment } from "./pending-funnel-adjustment.js";

test("PendingFunnelAdjustment starts in created", () => {
  const item = newPendingFunnelAdjustment("code-78", "title-86");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingFunnelAdjustment moves to published", () => {
  const item = newPendingFunnelAdjustment("code-78", "title-86");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PendingFunnelAdjustment rejects moves from retired", () => {
  const item = newPendingFunnelAdjustment("code-78", "title-86");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
