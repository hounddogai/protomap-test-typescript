import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointBatch } from "./touchpoint-batch.js";

test("TouchpointBatch starts in created", () => {
  const item = newTouchpointBatch("code-105", "title-69");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointBatch moves to retired", () => {
  const item = newTouchpointBatch("code-105", "title-69");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("TouchpointBatch rejects moves from retired", () => {
  const item = newTouchpointBatch("code-105", "title-69");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
