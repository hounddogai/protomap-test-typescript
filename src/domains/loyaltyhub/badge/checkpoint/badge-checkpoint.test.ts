import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeCheckpoint } from "./badge-checkpoint.js";

test("BadgeCheckpoint starts in requested", () => {
  const item = newBadgeCheckpoint("code-568", "name-39");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeCheckpoint moves to granted", () => {
  const item = newBadgeCheckpoint("code-568", "name-39");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("BadgeCheckpoint rejects moves from expired", () => {
  const item = newBadgeCheckpoint("code-568", "name-39");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
