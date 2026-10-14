import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingTouchpointRequest } from "./rolling-touchpoint-request.js";

test("RollingTouchpointRequest starts in new", () => {
  const item = newRollingTouchpointRequest("code-222", "title-959");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingTouchpointRequest moves to queued", () => {
  const item = newRollingTouchpointRequest("code-222", "title-959");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RollingTouchpointRequest rejects moves from failed", () => {
  const item = newRollingTouchpointRequest("code-222", "title-959");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
