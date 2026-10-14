import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowThreshold } from "./window-threshold.js";

test("WindowThreshold starts in draft", () => {
  const item = newWindowThreshold("code-29", "title-318");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowThreshold moves to pending", () => {
  const item = newWindowThreshold("code-29", "title-318");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("WindowThreshold rejects moves from closed", () => {
  const item = newWindowThreshold("code-29", "title-318");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
