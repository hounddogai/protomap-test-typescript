import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualPlacementSlot } from "./manual-placement-slot.js";

test("ManualPlacementSlot starts in open", () => {
  const item = newManualPlacementSlot("code-407", "name-716");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualPlacementSlot moves to reopened", () => {
  const item = newManualPlacementSlot("code-407", "name-716");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("ManualPlacementSlot rejects moves from archived", () => {
  const item = newManualPlacementSlot("code-407", "name-716");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
