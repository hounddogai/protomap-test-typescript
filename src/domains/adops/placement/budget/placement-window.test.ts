import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementWindow } from "./placement-window.js";

test("PlacementWindow starts in new", () => {
  const item = newPlacementWindow("code-971", "title-973");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementWindow moves to done", () => {
  const item = newPlacementWindow("code-971", "title-973");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("PlacementWindow rejects moves from failed", () => {
  const item = newPlacementWindow("code-971", "title-973");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
