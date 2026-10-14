import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalCreativeException } from "./global-creative-exception.js";

test("GlobalCreativeException starts in idle", () => {
  const item = newGlobalCreativeException("code-662", "label-218");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalCreativeException moves to ready", () => {
  const item = newGlobalCreativeException("code-662", "label-218");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("GlobalCreativeException rejects moves from stopped", () => {
  const item = newGlobalCreativeException("code-662", "label-218");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
