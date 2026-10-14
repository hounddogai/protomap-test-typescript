import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualNudgeOverride } from "./manual-nudge-override.js";

test("ManualNudgeOverride starts in draft", () => {
  const item = newManualNudgeOverride("code-197", "label-607");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualNudgeOverride moves to active", () => {
  const item = newManualNudgeOverride("code-197", "label-607");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ManualNudgeOverride rejects moves from closed", () => {
  const item = newManualNudgeOverride("code-197", "label-607");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
