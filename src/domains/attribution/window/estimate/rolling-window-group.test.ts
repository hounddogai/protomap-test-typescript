import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingWindowGroup } from "./rolling-window-group.js";

test("RollingWindowGroup starts in new", () => {
  const item = newRollingWindowGroup("code-754", "title-153");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingWindowGroup moves to queued", () => {
  const item = newRollingWindowGroup("code-754", "title-153");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RollingWindowGroup rejects moves from failed", () => {
  const item = newRollingWindowGroup("code-754", "title-153");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
