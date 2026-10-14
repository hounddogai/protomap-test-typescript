import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelScore } from "./funnel-score.js";

test("FunnelScore starts in new", () => {
  const item = newFunnelScore("code-248", "label-266");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelScore moves to running", () => {
  const item = newFunnelScore("code-248", "label-266");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("FunnelScore rejects moves from failed", () => {
  const item = newFunnelScore("code-248", "label-266");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
