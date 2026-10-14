import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationReview } from "./activation-review.js";

test("ActivationReview starts in idle", () => {
  const item = newActivationReview("code-561", "title-143");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationReview moves to ready", () => {
  const item = newActivationReview("code-561", "title-143");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("ActivationReview rejects moves from stopped", () => {
  const item = newActivationReview("code-561", "title-143");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
