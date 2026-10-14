import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedWindowRequest } from "./capped-window-request.js";

test("CappedWindowRequest starts in planned", () => {
  const item = newCappedWindowRequest("code-550", "title-357");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedWindowRequest moves to in progress", () => {
  const item = newCappedWindowRequest("code-550", "title-357");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("CappedWindowRequest rejects moves from cancelled", () => {
  const item = newCappedWindowRequest("code-550", "title-357");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
