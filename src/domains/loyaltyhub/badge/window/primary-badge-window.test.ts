import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryBadgeWindow } from "./primary-badge-window.js";

test("PrimaryBadgeWindow starts in idle", () => {
  const item = newPrimaryBadgeWindow("code-454", "name-496");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryBadgeWindow moves to ready", () => {
  const item = newPrimaryBadgeWindow("code-454", "name-496");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("PrimaryBadgeWindow rejects moves from stopped", () => {
  const item = newPrimaryBadgeWindow("code-454", "name-496");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
