import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyWaitCheckpoint } from "./legacy-wait-checkpoint.js";

test("LegacyWaitCheckpoint starts in planned", () => {
  const item = newLegacyWaitCheckpoint("code-897", "title-833");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyWaitCheckpoint moves to cancelled", () => {
  const item = newLegacyWaitCheckpoint("code-897", "title-833");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("LegacyWaitCheckpoint rejects moves from cancelled", () => {
  const item = newLegacyWaitCheckpoint("code-897", "title-833");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
