import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictTouchpointPolicy } from "./strict-touchpoint-policy.js";

test("StrictTouchpointPolicy starts in open", () => {
  const item = newStrictTouchpointPolicy("code-681", "label-917");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictTouchpointPolicy moves to resolved", () => {
  const item = newStrictTouchpointPolicy("code-681", "label-917");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("StrictTouchpointPolicy rejects moves from archived", () => {
  const item = newStrictTouchpointPolicy("code-681", "label-917");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
