import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalTouchpointAudit } from "./global-touchpoint-audit.js";

test("GlobalTouchpointAudit starts in requested", () => {
  const item = newGlobalTouchpointAudit("code-916", "name-383");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalTouchpointAudit moves to expired", () => {
  const item = newGlobalTouchpointAudit("code-916", "name-383");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("GlobalTouchpointAudit rejects moves from expired", () => {
  const item = newGlobalTouchpointAudit("code-916", "name-383");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
