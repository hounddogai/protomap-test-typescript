import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalRetentionRollup } from "./regional-retention-rollup.js";

test("RegionalRetentionRollup starts in idle", () => {
  const item = newRegionalRetentionRollup("code-906", "title-885");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalRetentionRollup moves to warming", () => {
  const item = newRegionalRetentionRollup("code-906", "title-885");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RegionalRetentionRollup rejects moves from stopped", () => {
  const item = newRegionalRetentionRollup("code-906", "title-885");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
