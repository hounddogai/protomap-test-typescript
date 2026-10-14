import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualTouchpointPolicy } from "./manual-touchpoint-policy.js";

test("ManualTouchpointPolicy starts in open", () => {
  const item = newManualTouchpointPolicy("code-536", "name-347");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualTouchpointPolicy moves to resolved", () => {
  const item = newManualTouchpointPolicy("code-536", "name-347");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ManualTouchpointPolicy rejects moves from archived", () => {
  const item = newManualTouchpointPolicy("code-536", "name-347");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
