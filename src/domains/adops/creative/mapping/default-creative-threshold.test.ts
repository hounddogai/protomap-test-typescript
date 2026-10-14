import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultCreativeThreshold } from "./default-creative-threshold.js";

test("DefaultCreativeThreshold starts in idle", () => {
  const item = newDefaultCreativeThreshold("code-252", "label-761");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultCreativeThreshold moves to stopped", () => {
  const item = newDefaultCreativeThreshold("code-252", "label-761");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("DefaultCreativeThreshold rejects moves from stopped", () => {
  const item = newDefaultCreativeThreshold("code-252", "label-761");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
