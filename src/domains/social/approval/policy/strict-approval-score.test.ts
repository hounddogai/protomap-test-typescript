import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictApprovalScore } from "./strict-approval-score.js";

test("StrictApprovalScore starts in idle", () => {
  const item = newStrictApprovalScore("code-656", "label-295");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictApprovalScore moves to ready", () => {
  const item = newStrictApprovalScore("code-656", "label-295");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("StrictApprovalScore rejects moves from stopped", () => {
  const item = newStrictApprovalScore("code-656", "label-295");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
