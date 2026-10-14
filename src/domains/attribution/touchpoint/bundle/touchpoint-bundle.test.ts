import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointBundle } from "./touchpoint-bundle.js";

test("TouchpointBundle starts in new", () => {
  const item = newTouchpointBundle("code-999", "name-940");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointBundle moves to done", () => {
  const item = newTouchpointBundle("code-999", "name-940");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("TouchpointBundle rejects moves from failed", () => {
  const item = newTouchpointBundle("code-999", "name-940");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
