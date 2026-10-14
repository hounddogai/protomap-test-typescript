import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackDoubleOptInBatch } from "./fallback-double-opt-in-batch.js";

test("FallbackDoubleOptInBatch starts in planned", () => {
  const item = newFallbackDoubleOptInBatch("code-723", "title-544");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackDoubleOptInBatch moves to in progress", () => {
  const item = newFallbackDoubleOptInBatch("code-723", "title-544");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("FallbackDoubleOptInBatch rejects moves from cancelled", () => {
  const item = newFallbackDoubleOptInBatch("code-723", "title-544");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
