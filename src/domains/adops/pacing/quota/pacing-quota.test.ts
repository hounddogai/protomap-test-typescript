import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingQuota } from "./pacing-quota.js";

test("PacingQuota starts in idle", () => {
  const item = newPacingQuota("code-288", "label-166");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingQuota moves to ready", () => {
  const item = newPacingQuota("code-288", "label-166");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("PacingQuota rejects moves from stopped", () => {
  const item = newPacingQuota("code-288", "label-166");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
