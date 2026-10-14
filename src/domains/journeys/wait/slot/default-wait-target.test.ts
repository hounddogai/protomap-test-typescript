import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultWaitTarget } from "./default-wait-target.js";

test("DefaultWaitTarget starts in draft", () => {
  const item = newDefaultWaitTarget("code-105", "label-574");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultWaitTarget moves to suspended", () => {
  const item = newDefaultWaitTarget("code-105", "label-574");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("DefaultWaitTarget rejects moves from closed", () => {
  const item = newDefaultWaitTarget("code-105", "label-574");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
