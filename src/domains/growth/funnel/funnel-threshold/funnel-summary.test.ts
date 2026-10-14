import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelSummary } from "./funnel-summary.js";

test("FunnelSummary starts in new", () => {
  const item = newFunnelSummary("code-633", "name-140");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelSummary moves to queued", () => {
  const item = newFunnelSummary("code-633", "name-140");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FunnelSummary rejects moves from failed", () => {
  const item = newFunnelSummary("code-633", "name-140");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
