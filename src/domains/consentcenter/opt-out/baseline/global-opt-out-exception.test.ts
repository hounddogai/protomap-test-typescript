import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalOptOutException } from "./global-opt-out-exception.js";

test("GlobalOptOutException starts in idle", () => {
  const item = newGlobalOptOutException("code-573", "title-492");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalOptOutException moves to draining", () => {
  const item = newGlobalOptOutException("code-573", "title-492");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("GlobalOptOutException rejects moves from stopped", () => {
  const item = newGlobalOptOutException("code-573", "title-492");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
