import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredSuppressionCheckpoint } from "./tiered-suppression-checkpoint.js";

test("TieredSuppressionCheckpoint starts in requested", () => {
  const item = newTieredSuppressionCheckpoint("code-546", "name-204");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredSuppressionCheckpoint moves to granted", () => {
  const item = newTieredSuppressionCheckpoint("code-546", "name-204");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("TieredSuppressionCheckpoint rejects moves from expired", () => {
  const item = newTieredSuppressionCheckpoint("code-546", "name-204");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
