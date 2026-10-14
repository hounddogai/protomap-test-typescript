import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveDeflectionScore } from "./adaptive-deflection-score.js";

test("AdaptiveDeflectionScore starts in idle", () => {
  const item = newAdaptiveDeflectionScore("code-529", "title-690");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveDeflectionScore moves to draining", () => {
  const item = newAdaptiveDeflectionScore("code-529", "title-690");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("AdaptiveDeflectionScore rejects moves from stopped", () => {
  const item = newAdaptiveDeflectionScore("code-529", "title-690");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
