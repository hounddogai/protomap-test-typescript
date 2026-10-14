import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientWarmupWindow } from "./lenient-warmup-window.js";

test("LenientWarmupWindow starts in new", () => {
  const item = newLenientWarmupWindow("code-74", "name-233");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientWarmupWindow moves to queued", () => {
  const item = newLenientWarmupWindow("code-74", "name-233");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("LenientWarmupWindow rejects moves from failed", () => {
  const item = newLenientWarmupWindow("code-74", "name-233");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
