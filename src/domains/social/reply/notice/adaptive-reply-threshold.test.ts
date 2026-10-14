import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveReplyThreshold } from "./adaptive-reply-threshold.js";

test("AdaptiveReplyThreshold starts in idle", () => {
  const item = newAdaptiveReplyThreshold("code-315", "title-490");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveReplyThreshold moves to warming", () => {
  const item = newAdaptiveReplyThreshold("code-315", "title-490");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("AdaptiveReplyThreshold rejects moves from stopped", () => {
  const item = newAdaptiveReplyThreshold("code-315", "title-490");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
