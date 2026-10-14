import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionBatch } from "./deflection-batch.js";

test("DeflectionBatch starts in new", () => {
  const item = newDeflectionBatch("code-109", "name-304");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionBatch moves to done", () => {
  const item = newDeflectionBatch("code-109", "name-304");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("DeflectionBatch rejects moves from failed", () => {
  const item = newDeflectionBatch("code-109", "name-304");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
