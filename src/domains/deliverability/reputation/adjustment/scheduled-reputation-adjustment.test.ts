import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledReputationAdjustment } from "./scheduled-reputation-adjustment.js";

test("ScheduledReputationAdjustment starts in new", () => {
  const item = newScheduledReputationAdjustment("code-829", "title-679");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledReputationAdjustment moves to queued", () => {
  const item = newScheduledReputationAdjustment("code-829", "title-679");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ScheduledReputationAdjustment rejects moves from failed", () => {
  const item = newScheduledReputationAdjustment("code-829", "title-679");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
