import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyStreakCheckpoint } from "./legacy-streak-checkpoint.js";

test("LegacyStreakCheckpoint starts in requested", () => {
  const item = newLegacyStreakCheckpoint("code-112", "title-405");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyStreakCheckpoint moves to expired", () => {
  const item = newLegacyStreakCheckpoint("code-112", "title-405");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("LegacyStreakCheckpoint rejects moves from expired", () => {
  const item = newLegacyStreakCheckpoint("code-112", "title-405");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
