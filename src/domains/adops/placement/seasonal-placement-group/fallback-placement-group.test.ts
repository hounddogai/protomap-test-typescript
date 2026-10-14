import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackPlacementGroup } from "./fallback-placement-group.js";

test("FallbackPlacementGroup starts in idle", () => {
  const item = newFallbackPlacementGroup("code-927", "title-26");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackPlacementGroup moves to ready", () => {
  const item = newFallbackPlacementGroup("code-927", "title-26");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("FallbackPlacementGroup rejects moves from stopped", () => {
  const item = newFallbackPlacementGroup("code-927", "title-26");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
