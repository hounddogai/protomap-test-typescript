import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingWaitWindow } from "./rolling-wait-window.js";

test("RollingWaitWindow starts in draft", () => {
  const item = newRollingWaitWindow("code-942", "label-765");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingWaitWindow moves to suspended", () => {
  const item = newRollingWaitWindow("code-942", "label-765");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("RollingWaitWindow rejects moves from closed", () => {
  const item = newRollingWaitWindow("code-942", "label-765");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
