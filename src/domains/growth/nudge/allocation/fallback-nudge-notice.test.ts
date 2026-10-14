import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackNudgeNotice } from "./fallback-nudge-notice.js";

test("FallbackNudgeNotice starts in idle", () => {
  const item = newFallbackNudgeNotice("code-846", "title-187");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackNudgeNotice moves to warming", () => {
  const item = newFallbackNudgeNotice("code-846", "title-187");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("FallbackNudgeNotice rejects moves from stopped", () => {
  const item = newFallbackNudgeNotice("code-846", "title-187");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
