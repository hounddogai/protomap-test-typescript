import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointNotice } from "./touchpoint-notice.js";

test("TouchpointNotice starts in idle", () => {
  const item = newTouchpointNotice("code-748", "name-675");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointNotice moves to warming", () => {
  const item = newTouchpointNotice("code-748", "name-675");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("TouchpointNotice rejects moves from stopped", () => {
  const item = newTouchpointNotice("code-748", "name-675");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
