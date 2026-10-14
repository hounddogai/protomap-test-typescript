import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientRetentionRequest } from "./lenient-retention-request.js";

test("LenientRetentionRequest starts in idle", () => {
  const item = newLenientRetentionRequest("code-651", "label-80");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientRetentionRequest moves to warming", () => {
  const item = newLenientRetentionRequest("code-651", "label-80");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LenientRetentionRequest rejects moves from stopped", () => {
  const item = newLenientRetentionRequest("code-651", "label-80");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
