import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledModelAdjustment } from "./scheduled-model-adjustment.js";

test("ScheduledModelAdjustment starts in requested", () => {
  const item = newScheduledModelAdjustment("code-272", "label-917");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledModelAdjustment moves to revoked", () => {
  const item = newScheduledModelAdjustment("code-272", "label-917");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ScheduledModelAdjustment rejects moves from expired", () => {
  const item = newScheduledModelAdjustment("code-272", "label-917");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
