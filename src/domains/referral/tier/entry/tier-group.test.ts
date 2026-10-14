import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierGroup } from "./tier-group.js";

test("TierGroup starts in idle", () => {
  const item = newTierGroup("code-94", "title-660");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierGroup moves to draining", () => {
  const item = newTierGroup("code-94", "title-660");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("TierGroup rejects moves from stopped", () => {
  const item = newTierGroup("code-94", "title-660");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
