import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointWindow } from "./touchpoint-window.js";

test("TouchpointWindow starts in proposed", () => {
  const item = newTouchpointWindow("code-988", "name-857");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointWindow moves to approved", () => {
  const item = newTouchpointWindow("code-988", "name-857");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("TouchpointWindow rejects moves from withdrawn", () => {
  const item = newTouchpointWindow("code-988", "name-857");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
