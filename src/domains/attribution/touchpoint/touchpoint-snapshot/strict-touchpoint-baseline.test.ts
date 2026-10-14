import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictTouchpointBaseline } from "./strict-touchpoint-baseline.js";

test("StrictTouchpointBaseline starts in planned", () => {
  const item = newStrictTouchpointBaseline("code-298", "name-99");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictTouchpointBaseline moves to completed", () => {
  const item = newStrictTouchpointBaseline("code-298", "name-99");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("StrictTouchpointBaseline rejects moves from cancelled", () => {
  const item = newStrictTouchpointBaseline("code-298", "name-99");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
