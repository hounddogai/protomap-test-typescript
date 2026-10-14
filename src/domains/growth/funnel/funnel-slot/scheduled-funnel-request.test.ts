import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledFunnelRequest } from "./scheduled-funnel-request.js";

test("ScheduledFunnelRequest starts in new", () => {
  const item = newScheduledFunnelRequest("code-55", "name-664");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledFunnelRequest moves to failed", () => {
  const item = newScheduledFunnelRequest("code-55", "name-664");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("ScheduledFunnelRequest rejects moves from failed", () => {
  const item = newScheduledFunnelRequest("code-55", "name-664");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
