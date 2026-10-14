import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionAdjustment } from "./suppression-adjustment.js";

test("SuppressionAdjustment starts in requested", () => {
  const item = newSuppressionAdjustment("code-313", "title-391");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionAdjustment moves to expired", () => {
  const item = newSuppressionAdjustment("code-313", "title-391");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("SuppressionAdjustment rejects moves from expired", () => {
  const item = newSuppressionAdjustment("code-313", "title-391");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
