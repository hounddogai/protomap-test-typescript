import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointBaseline } from "./touchpoint-baseline.js";

test("TouchpointBaseline starts in idle", () => {
  const item = newTouchpointBaseline("code-115", "name-244");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointBaseline moves to draining", () => {
  const item = newTouchpointBaseline("code-115", "name-244");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("TouchpointBaseline rejects moves from stopped", () => {
  const item = newTouchpointBaseline("code-115", "name-244");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
