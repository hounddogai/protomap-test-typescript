import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowCycle } from "./window-cycle.js";

test("WindowCycle starts in idle", () => {
  const item = newWindowCycle("code-648", "title-592");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowCycle moves to warming", () => {
  const item = newWindowCycle("code-648", "title-592");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("WindowCycle rejects moves from stopped", () => {
  const item = newWindowCycle("code-648", "title-592");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
