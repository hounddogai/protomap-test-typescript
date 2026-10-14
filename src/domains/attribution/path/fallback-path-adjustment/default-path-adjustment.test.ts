import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPathAdjustment } from "./default-path-adjustment.js";

test("DefaultPathAdjustment starts in new", () => {
  const item = newDefaultPathAdjustment("code-789", "title-175");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPathAdjustment moves to running", () => {
  const item = newDefaultPathAdjustment("code-789", "title-175");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("DefaultPathAdjustment rejects moves from failed", () => {
  const item = newDefaultPathAdjustment("code-789", "title-175");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
