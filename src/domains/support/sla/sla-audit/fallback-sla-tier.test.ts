import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackSlaTier } from "./fallback-sla-tier.js";

test("FallbackSlaTier starts in idle", () => {
  const item = newFallbackSlaTier("code-159", "name-235");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackSlaTier moves to draining", () => {
  const item = newFallbackSlaTier("code-159", "name-235");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("FallbackSlaTier rejects moves from stopped", () => {
  const item = newFallbackSlaTier("code-159", "name-235");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
