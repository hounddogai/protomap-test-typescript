import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionTier } from "./deflection-tier.js";

test("DeflectionTier starts in idle", () => {
  const item = newDeflectionTier("code-534", "title-395");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionTier moves to ready", () => {
  const item = newDeflectionTier("code-534", "title-395");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("DeflectionTier rejects moves from stopped", () => {
  const item = newDeflectionTier("code-534", "title-395");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
