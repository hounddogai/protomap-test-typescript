import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroEstimate } from "./macro-estimate.js";

test("MacroEstimate starts in planned", () => {
  const item = newMacroEstimate("code-69", "title-846");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroEstimate moves to cancelled", () => {
  const item = newMacroEstimate("code-69", "title-846");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("MacroEstimate rejects moves from cancelled", () => {
  const item = newMacroEstimate("code-69", "title-846");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
