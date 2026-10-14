import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedActivationSlot } from "./capped-activation-slot.js";

test("CappedActivationSlot starts in proposed", () => {
  const item = newCappedActivationSlot("code-624", "name-231");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedActivationSlot moves to rejected", () => {
  const item = newCappedActivationSlot("code-624", "name-231");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("CappedActivationSlot rejects moves from withdrawn", () => {
  const item = newCappedActivationSlot("code-624", "name-231");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
