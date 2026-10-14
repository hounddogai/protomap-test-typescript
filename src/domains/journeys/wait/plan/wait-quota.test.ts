import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitQuota } from "./wait-quota.js";

test("WaitQuota starts in idle", () => {
  const item = newWaitQuota("code-641", "title-416");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitQuota moves to warming", () => {
  const item = newWaitQuota("code-641", "title-416");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("WaitQuota rejects moves from stopped", () => {
  const item = newWaitQuota("code-641", "title-416");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
