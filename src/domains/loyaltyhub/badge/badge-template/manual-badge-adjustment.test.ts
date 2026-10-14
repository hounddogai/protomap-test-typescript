import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualBadgeAdjustment } from "./manual-badge-adjustment.js";

test("ManualBadgeAdjustment starts in planned", () => {
  const item = newManualBadgeAdjustment("code-3", "label-529");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualBadgeAdjustment moves to scheduled", () => {
  const item = newManualBadgeAdjustment("code-3", "label-529");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ManualBadgeAdjustment rejects moves from cancelled", () => {
  const item = newManualBadgeAdjustment("code-3", "label-529");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
