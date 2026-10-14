import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupNotice } from "./warmup-notice.js";

test("WarmupNotice starts in new", () => {
  const item = newWarmupNotice("code-97", "name-320");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupNotice moves to queued", () => {
  const item = newWarmupNotice("code-97", "name-320");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("WarmupNotice rejects moves from failed", () => {
  const item = newWarmupNotice("code-97", "name-320");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
