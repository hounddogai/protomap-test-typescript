import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupClaim } from "./warmup-claim.js";

test("WarmupClaim starts in idle", () => {
  const item = newWarmupClaim("code-573", "title-983");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupClaim moves to warming", () => {
  const item = newWarmupClaim("code-573", "title-983");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("WarmupClaim rejects moves from stopped", () => {
  const item = newWarmupClaim("code-573", "title-983");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
