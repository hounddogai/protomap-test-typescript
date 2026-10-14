import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingFunnelRequest } from "./rolling-funnel-request.js";

test("RollingFunnelRequest starts in planned", () => {
  const item = newRollingFunnelRequest("code-897", "title-733");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingFunnelRequest moves to scheduled", () => {
  const item = newRollingFunnelRequest("code-897", "title-733");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RollingFunnelRequest rejects moves from cancelled", () => {
  const item = newRollingFunnelRequest("code-897", "title-733");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
