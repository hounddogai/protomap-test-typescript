import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionGroup } from "./retention-group.js";

test("RetentionGroup starts in idle", () => {
  const item = newRetentionGroup("code-429", "name-186");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionGroup moves to stopped", () => {
  const item = newRetentionGroup("code-429", "name-186");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("RetentionGroup rejects moves from stopped", () => {
  const item = newRetentionGroup("code-429", "name-186");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
