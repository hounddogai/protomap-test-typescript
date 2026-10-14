import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictTouchpointEstimate } from "./strict-touchpoint-estimate.js";

test("StrictTouchpointEstimate starts in requested", () => {
  const item = newStrictTouchpointEstimate("code-939", "label-852");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictTouchpointEstimate moves to granted", () => {
  const item = newStrictTouchpointEstimate("code-939", "label-852");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("StrictTouchpointEstimate rejects moves from expired", () => {
  const item = newStrictTouchpointEstimate("code-939", "label-852");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
