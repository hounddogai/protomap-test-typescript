import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathTarget } from "./path-target.js";

test("PathTarget starts in new", () => {
  const item = newPathTarget("code-518", "name-892");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathTarget moves to done", () => {
  const item = newPathTarget("code-518", "name-892");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("PathTarget rejects moves from failed", () => {
  const item = newPathTarget("code-518", "name-892");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
