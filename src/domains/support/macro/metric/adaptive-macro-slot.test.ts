import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveMacroSlot } from "./adaptive-macro-slot.js";

test("AdaptiveMacroSlot starts in open", () => {
  const item = newAdaptiveMacroSlot("code-277", "name-183");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveMacroSlot moves to reopened", () => {
  const item = newAdaptiveMacroSlot("code-277", "name-183");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("AdaptiveMacroSlot rejects moves from archived", () => {
  const item = newAdaptiveMacroSlot("code-277", "name-183");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
