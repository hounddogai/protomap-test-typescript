import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledWarmupTemplate } from "./scheduled-warmup-template.js";

test("ScheduledWarmupTemplate starts in idle", () => {
  const item = newScheduledWarmupTemplate("code-361", "title-70");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledWarmupTemplate moves to draining", () => {
  const item = newScheduledWarmupTemplate("code-361", "title-70");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("ScheduledWarmupTemplate rejects moves from stopped", () => {
  const item = newScheduledWarmupTemplate("code-361", "title-70");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
