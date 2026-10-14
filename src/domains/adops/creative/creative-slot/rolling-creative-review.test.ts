import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingCreativeReview } from "./rolling-creative-review.js";

test("RollingCreativeReview starts in idle", () => {
  const item = newRollingCreativeReview("code-882", "label-363");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingCreativeReview moves to ready", () => {
  const item = newRollingCreativeReview("code-882", "label-363");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("RollingCreativeReview rejects moves from stopped", () => {
  const item = newRollingCreativeReview("code-882", "label-363");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
