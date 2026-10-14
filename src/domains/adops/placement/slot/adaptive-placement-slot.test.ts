import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptivePlacementSlot } from "./adaptive-placement-slot.js";

test("AdaptivePlacementSlot starts in requested", () => {
  const item = newAdaptivePlacementSlot("code-174", "label-251");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptivePlacementSlot moves to granted", () => {
  const item = newAdaptivePlacementSlot("code-174", "label-251");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("AdaptivePlacementSlot rejects moves from expired", () => {
  const item = newAdaptivePlacementSlot("code-174", "label-251");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
