import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictQueueScore } from "./strict-queue-score.js";

test("StrictQueueScore starts in requested", () => {
  const item = newStrictQueueScore("code-21", "name-68");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictQueueScore moves to granted", () => {
  const item = newStrictQueueScore("code-21", "name-68");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("StrictQueueScore rejects moves from expired", () => {
  const item = newStrictQueueScore("code-21", "name-68");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
