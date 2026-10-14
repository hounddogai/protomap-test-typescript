import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledWarmupClaim } from "./scheduled-warmup-claim.js";

test("ScheduledWarmupClaim starts in open", () => {
  const item = newScheduledWarmupClaim("code-982", "label-314");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledWarmupClaim moves to resolved", () => {
  const item = newScheduledWarmupClaim("code-982", "label-314");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ScheduledWarmupClaim rejects moves from archived", () => {
  const item = newScheduledWarmupClaim("code-982", "label-314");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
