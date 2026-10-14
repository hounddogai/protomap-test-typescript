import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionWindow } from "./retention-window.js";

test("RetentionWindow starts in new", () => {
  const item = newRetentionWindow("code-495", "label-666");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionWindow moves to done", () => {
  const item = newRetentionWindow("code-495", "label-666");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("RetentionWindow rejects moves from failed", () => {
  const item = newRetentionWindow("code-495", "label-666");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
