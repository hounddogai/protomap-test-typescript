import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingQueueOverride } from "./rolling-queue-override.js";

test("RollingQueueOverride starts in draft", () => {
  const item = newRollingQueueOverride("code-986", "name-777");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingQueueOverride moves to suspended", () => {
  const item = newRollingQueueOverride("code-986", "name-777");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("RollingQueueOverride rejects moves from closed", () => {
  const item = newRollingQueueOverride("code-986", "name-777");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
