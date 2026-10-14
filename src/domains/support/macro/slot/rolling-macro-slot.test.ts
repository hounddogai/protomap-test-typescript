import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingMacroSlot } from "./rolling-macro-slot.js";

test("RollingMacroSlot starts in proposed", () => {
  const item = newRollingMacroSlot("code-728", "label-168");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingMacroSlot moves to rejected", () => {
  const item = newRollingMacroSlot("code-728", "label-168");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RollingMacroSlot rejects moves from withdrawn", () => {
  const item = newRollingMacroSlot("code-728", "label-168");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
