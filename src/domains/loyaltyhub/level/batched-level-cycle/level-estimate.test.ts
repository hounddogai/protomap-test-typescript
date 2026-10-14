import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelEstimate } from "./level-estimate.js";

test("LevelEstimate starts in requested", () => {
  const item = newLevelEstimate("code-39", "name-456");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelEstimate moves to revoked", () => {
  const item = newLevelEstimate("code-39", "name-456");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("LevelEstimate rejects moves from expired", () => {
  const item = newLevelEstimate("code-39", "name-456");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
