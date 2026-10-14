import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedWaitProfile } from "./capped-wait-profile.js";

test("CappedWaitProfile starts in idle", () => {
  const item = newCappedWaitProfile("code-857", "name-220");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedWaitProfile moves to ready", () => {
  const item = newCappedWaitProfile("code-857", "name-220");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("CappedWaitProfile rejects moves from stopped", () => {
  const item = newCappedWaitProfile("code-857", "name-220");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
