import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupTarget } from "./warmup-target.js";

test("WarmupTarget starts in new", () => {
  const item = newWarmupTarget("code-734", "title-894");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupTarget moves to failed", () => {
  const item = newWarmupTarget("code-734", "title-894");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("WarmupTarget rejects moves from failed", () => {
  const item = newWarmupTarget("code-734", "title-894");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
