import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPostTarget } from "./lenient-post-target.js";

test("LenientPostTarget starts in idle", () => {
  const item = newLenientPostTarget("code-629", "name-976");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPostTarget moves to ready", () => {
  const item = newLenientPostTarget("code-629", "name-976");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("LenientPostTarget rejects moves from stopped", () => {
  const item = newLenientPostTarget("code-629", "name-976");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
