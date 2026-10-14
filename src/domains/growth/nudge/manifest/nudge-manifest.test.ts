import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeManifest } from "./nudge-manifest.js";

test("NudgeManifest starts in idle", () => {
  const item = newNudgeManifest("code-135", "label-844");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeManifest moves to draining", () => {
  const item = newNudgeManifest("code-135", "label-844");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("NudgeManifest rejects moves from stopped", () => {
  const item = newNudgeManifest("code-135", "label-844");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
