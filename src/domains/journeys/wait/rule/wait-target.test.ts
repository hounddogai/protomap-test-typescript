import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitTarget } from "./wait-target.js";

test("WaitTarget starts in open", () => {
  const item = newWaitTarget("code-342", "name-665");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitTarget moves to resolved", () => {
  const item = newWaitTarget("code-342", "name-665");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("WaitTarget rejects moves from archived", () => {
  const item = newWaitTarget("code-342", "name-665");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
