import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierCheckpoint } from "./tier-checkpoint.js";

test("TierCheckpoint starts in draft", () => {
  const item = newTierCheckpoint("code-511", "name-389");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierCheckpoint moves to suspended", () => {
  const item = newTierCheckpoint("code-511", "name-389");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("TierCheckpoint rejects moves from closed", () => {
  const item = newTierCheckpoint("code-511", "name-389");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
