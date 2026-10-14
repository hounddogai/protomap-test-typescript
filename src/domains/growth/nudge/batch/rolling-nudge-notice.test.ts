import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingNudgeNotice } from "./rolling-nudge-notice.js";

test("RollingNudgeNotice starts in idle", () => {
  const item = newRollingNudgeNotice("code-64", "title-853");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingNudgeNotice moves to draining", () => {
  const item = newRollingNudgeNotice("code-64", "title-853");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("RollingNudgeNotice rejects moves from stopped", () => {
  const item = newRollingNudgeNotice("code-64", "title-853");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
