import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedTouchpointSnapshot } from "./capped-touchpoint-snapshot.js";

test("CappedTouchpointSnapshot starts in new", () => {
  const item = newCappedTouchpointSnapshot("code-873", "title-654");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedTouchpointSnapshot moves to running", () => {
  const item = newCappedTouchpointSnapshot("code-873", "title-654");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("CappedTouchpointSnapshot rejects moves from failed", () => {
  const item = newCappedTouchpointSnapshot("code-873", "title-654");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
