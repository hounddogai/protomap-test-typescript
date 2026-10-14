import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelAssignment } from "./funnel-assignment.js";

test("FunnelAssignment starts in idle", () => {
  const item = newFunnelAssignment("code-560", "title-610");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelAssignment moves to warming", () => {
  const item = newFunnelAssignment("code-560", "title-610");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("FunnelAssignment rejects moves from stopped", () => {
  const item = newFunnelAssignment("code-560", "title-610");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
