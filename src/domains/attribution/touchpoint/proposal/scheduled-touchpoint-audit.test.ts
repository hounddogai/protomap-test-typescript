import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledTouchpointAudit } from "./scheduled-touchpoint-audit.js";

test("ScheduledTouchpointAudit starts in open", () => {
  const item = newScheduledTouchpointAudit("code-132", "label-664");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledTouchpointAudit moves to resolved", () => {
  const item = newScheduledTouchpointAudit("code-132", "label-664");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ScheduledTouchpointAudit rejects moves from archived", () => {
  const item = newScheduledTouchpointAudit("code-132", "label-664");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
