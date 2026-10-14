import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalDeflectionCheckpoint } from "./global-deflection-checkpoint.js";

test("GlobalDeflectionCheckpoint starts in idle", () => {
  const item = newGlobalDeflectionCheckpoint("code-201", "label-413");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalDeflectionCheckpoint moves to warming", () => {
  const item = newGlobalDeflectionCheckpoint("code-201", "label-413");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("GlobalDeflectionCheckpoint rejects moves from stopped", () => {
  const item = newGlobalDeflectionCheckpoint("code-201", "label-413");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
