import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaTarget } from "./sla-target.js";

test("SlaTarget starts in idle", () => {
  const item = newSlaTarget("code-476", "name-677");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaTarget moves to ready", () => {
  const item = newSlaTarget("code-476", "name-677");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("SlaTarget rejects moves from stopped", () => {
  const item = newSlaTarget("code-476", "name-677");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
