import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeOverride } from "./nudge-override.js";

test("NudgeOverride starts in idle", () => {
  const item = newNudgeOverride("code-434", "title-247");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeOverride moves to draining", () => {
  const item = newNudgeOverride("code-434", "title-247");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("NudgeOverride rejects moves from stopped", () => {
  const item = newNudgeOverride("code-434", "title-247");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
