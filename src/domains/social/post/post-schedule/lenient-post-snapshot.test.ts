import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPostSnapshot } from "./lenient-post-snapshot.js";

test("LenientPostSnapshot starts in idle", () => {
  const item = newLenientPostSnapshot("code-620", "name-406");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPostSnapshot moves to draining", () => {
  const item = newLenientPostSnapshot("code-620", "name-406");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("LenientPostSnapshot rejects moves from stopped", () => {
  const item = newLenientPostSnapshot("code-620", "name-406");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
