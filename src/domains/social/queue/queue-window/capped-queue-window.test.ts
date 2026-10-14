import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedQueueWindow } from "./capped-queue-window.js";

test("CappedQueueWindow starts in open", () => {
  const item = newCappedQueueWindow("code-176", "name-436");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedQueueWindow moves to resolved", () => {
  const item = newCappedQueueWindow("code-176", "name-436");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("CappedQueueWindow rejects moves from archived", () => {
  const item = newCappedQueueWindow("code-176", "name-436");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
