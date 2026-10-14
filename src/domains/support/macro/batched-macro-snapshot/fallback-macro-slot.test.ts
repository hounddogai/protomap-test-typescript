import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackMacroSlot } from "./fallback-macro-slot.js";

test("FallbackMacroSlot starts in open", () => {
  const item = newFallbackMacroSlot("code-930", "label-197");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackMacroSlot moves to reopened", () => {
  const item = newFallbackMacroSlot("code-930", "label-197");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("FallbackMacroSlot rejects moves from archived", () => {
  const item = newFallbackMacroSlot("code-930", "label-197");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
