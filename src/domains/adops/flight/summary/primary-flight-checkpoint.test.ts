import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryFlightCheckpoint } from "./primary-flight-checkpoint.js";

test("PrimaryFlightCheckpoint starts in draft", () => {
  const item = newPrimaryFlightCheckpoint("code-546", "name-673");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryFlightCheckpoint moves to pending", () => {
  const item = newPrimaryFlightCheckpoint("code-546", "name-673");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PrimaryFlightCheckpoint rejects moves from closed", () => {
  const item = newPrimaryFlightCheckpoint("code-546", "name-673");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
