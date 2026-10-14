import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointThreshold } from "./touchpoint-threshold.js";

test("TouchpointThreshold starts in draft", () => {
  const item = newTouchpointThreshold("code-287", "label-439");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointThreshold moves to pending", () => {
  const item = newTouchpointThreshold("code-287", "label-439");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("TouchpointThreshold rejects moves from closed", () => {
  const item = newTouchpointThreshold("code-287", "label-439");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
