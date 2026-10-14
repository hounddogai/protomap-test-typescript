import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionCheckpoint } from "./deflection-checkpoint.js";

test("DeflectionCheckpoint starts in draft", () => {
  const item = newDeflectionCheckpoint("code-189", "name-343");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionCheckpoint moves to pending", () => {
  const item = newDeflectionCheckpoint("code-189", "name-343");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("DeflectionCheckpoint rejects moves from closed", () => {
  const item = newDeflectionCheckpoint("code-189", "name-343");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
