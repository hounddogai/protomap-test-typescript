import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceWindow } from "./bounce-window.js";

test("BounceWindow starts in open", () => {
  const item = newBounceWindow("code-57", "title-708");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceWindow moves to reopened", () => {
  const item = newBounceWindow("code-57", "title-708");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("BounceWindow rejects moves from archived", () => {
  const item = newBounceWindow("code-57", "title-708");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
