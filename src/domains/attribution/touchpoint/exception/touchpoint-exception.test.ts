import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointException } from "./touchpoint-exception.js";

test("TouchpointException starts in planned", () => {
  const item = newTouchpointException("code-884", "label-18");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointException moves to in progress", () => {
  const item = newTouchpointException("code-884", "label-18");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("TouchpointException rejects moves from cancelled", () => {
  const item = newTouchpointException("code-884", "label-18");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
