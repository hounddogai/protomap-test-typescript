import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelThreshold } from "./funnel-threshold.js";

test("FunnelThreshold starts in created", () => {
  const item = newFunnelThreshold("code-233", "title-103");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelThreshold moves to retired", () => {
  const item = newFunnelThreshold("code-233", "title-103");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("FunnelThreshold rejects moves from retired", () => {
  const item = newFunnelThreshold("code-233", "title-103");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
