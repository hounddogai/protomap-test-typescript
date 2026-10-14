import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictPlacementSlot } from "./strict-placement-slot.js";

test("StrictPlacementSlot starts in draft", () => {
  const item = newStrictPlacementSlot("code-400", "name-517");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictPlacementSlot moves to suspended", () => {
  const item = newStrictPlacementSlot("code-400", "name-517");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("StrictPlacementSlot rejects moves from closed", () => {
  const item = newStrictPlacementSlot("code-400", "name-517");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
