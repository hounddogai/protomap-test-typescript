import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveBounceGroup } from "./adaptive-bounce-group.js";

test("AdaptiveBounceGroup starts in idle", () => {
  const item = newAdaptiveBounceGroup("code-1", "title-230");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveBounceGroup moves to warming", () => {
  const item = newAdaptiveBounceGroup("code-1", "title-230");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("AdaptiveBounceGroup rejects moves from stopped", () => {
  const item = newAdaptiveBounceGroup("code-1", "title-230");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
