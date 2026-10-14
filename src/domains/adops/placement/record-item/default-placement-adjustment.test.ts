import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPlacementAdjustment } from "./default-placement-adjustment.js";

test("DefaultPlacementAdjustment starts in requested", () => {
  const item = newDefaultPlacementAdjustment("code-655", "label-587");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPlacementAdjustment moves to granted", () => {
  const item = newDefaultPlacementAdjustment("code-655", "label-587");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("DefaultPlacementAdjustment rejects moves from expired", () => {
  const item = newDefaultPlacementAdjustment("code-655", "label-587");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
