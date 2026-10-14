import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInSnapshot } from "./double-opt-in-snapshot.js";

test("DoubleOptInSnapshot starts in idle", () => {
  const item = newDoubleOptInSnapshot("code-299", "title-576");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInSnapshot moves to draining", () => {
  const item = newDoubleOptInSnapshot("code-299", "title-576");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("DoubleOptInSnapshot rejects moves from stopped", () => {
  const item = newDoubleOptInSnapshot("code-299", "title-576");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
