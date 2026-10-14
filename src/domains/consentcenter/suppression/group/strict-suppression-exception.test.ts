import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictSuppressionException } from "./strict-suppression-exception.js";

test("StrictSuppressionException starts in idle", () => {
  const item = newStrictSuppressionException("code-616", "name-169");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictSuppressionException moves to ready", () => {
  const item = newStrictSuppressionException("code-616", "name-169");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("StrictSuppressionException rejects moves from stopped", () => {
  const item = newStrictSuppressionException("code-616", "name-169");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
