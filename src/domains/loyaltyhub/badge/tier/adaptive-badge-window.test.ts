import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveBadgeWindow } from "./adaptive-badge-window.js";

test("AdaptiveBadgeWindow starts in idle", () => {
  const item = newAdaptiveBadgeWindow("code-932", "label-822");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveBadgeWindow moves to warming", () => {
  const item = newAdaptiveBadgeWindow("code-932", "label-822");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("AdaptiveBadgeWindow rejects moves from stopped", () => {
  const item = newAdaptiveBadgeWindow("code-932", "label-822");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
