import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostAdjustment } from "./post-adjustment.js";

test("PostAdjustment starts in idle", () => {
  const item = newPostAdjustment("code-943", "title-604");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostAdjustment moves to warming", () => {
  const item = newPostAdjustment("code-943", "title-604");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PostAdjustment rejects moves from stopped", () => {
  const item = newPostAdjustment("code-943", "title-604");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
