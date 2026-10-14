import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictQueueTarget } from "./strict-queue-target.js";

test("StrictQueueTarget starts in open", () => {
  const item = newStrictQueueTarget("code-122", "title-797");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictQueueTarget moves to resolved", () => {
  const item = newStrictQueueTarget("code-122", "title-797");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("StrictQueueTarget rejects moves from archived", () => {
  const item = newStrictQueueTarget("code-122", "title-797");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
