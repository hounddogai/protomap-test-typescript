import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredBounceDraft } from "./tiered-bounce-draft.js";

test("TieredBounceDraft starts in idle", () => {
  const item = newTieredBounceDraft("code-36", "name-410");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredBounceDraft moves to draining", () => {
  const item = newTieredBounceDraft("code-36", "name-410");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("TieredBounceDraft rejects moves from stopped", () => {
  const item = newTieredBounceDraft("code-36", "name-410");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
