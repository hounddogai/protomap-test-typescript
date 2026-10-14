import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPostQuota } from "./rolling-post-quota.js";

test("RollingPostQuota starts in new", () => {
  const item = newRollingPostQuota("code-590", "label-770");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPostQuota moves to queued", () => {
  const item = newRollingPostQuota("code-590", "label-770");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RollingPostQuota rejects moves from failed", () => {
  const item = newRollingPostQuota("code-590", "label-770");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
