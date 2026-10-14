import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelSlot } from "./funnel-slot.js";

test("FunnelSlot starts in new", () => {
  const item = newFunnelSlot("code-43", "name-426");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelSlot moves to done", () => {
  const item = newFunnelSlot("code-43", "name-426");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("FunnelSlot rejects moves from failed", () => {
  const item = newFunnelSlot("code-43", "name-426");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
