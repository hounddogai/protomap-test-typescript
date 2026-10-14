import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryTouchpointWindow } from "./primary-touchpoint-window.js";

test("PrimaryTouchpointWindow starts in created", () => {
  const item = newPrimaryTouchpointWindow("code-753", "label-671");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryTouchpointWindow moves to published", () => {
  const item = newPrimaryTouchpointWindow("code-753", "label-671");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PrimaryTouchpointWindow rejects moves from retired", () => {
  const item = newPrimaryTouchpointWindow("code-753", "label-671");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
