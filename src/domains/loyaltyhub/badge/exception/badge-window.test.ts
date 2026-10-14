import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeWindow } from "./badge-window.js";

test("BadgeWindow starts in idle", () => {
  const item = newBadgeWindow("code-566", "title-619");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeWindow moves to ready", () => {
  const item = newBadgeWindow("code-566", "title-619");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("BadgeWindow rejects moves from stopped", () => {
  const item = newBadgeWindow("code-566", "title-619");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
