import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalComplaintCycle } from "./global-complaint-cycle.js";

test("GlobalComplaintCycle starts in idle", () => {
  const item = newGlobalComplaintCycle("code-656", "name-178");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalComplaintCycle moves to stopped", () => {
  const item = newGlobalComplaintCycle("code-656", "name-178");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("GlobalComplaintCycle rejects moves from stopped", () => {
  const item = newGlobalComplaintCycle("code-656", "name-178");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
