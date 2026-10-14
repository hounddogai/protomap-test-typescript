import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeSnapshot } from "./nudge-snapshot.js";

test("NudgeSnapshot starts in idle", () => {
  const item = newNudgeSnapshot("code-103", "title-487");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeSnapshot moves to ready", () => {
  const item = newNudgeSnapshot("code-103", "title-487");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("NudgeSnapshot rejects moves from stopped", () => {
  const item = newNudgeSnapshot("code-103", "title-487");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
