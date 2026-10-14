import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroAllocation } from "./macro-allocation.js";

test("MacroAllocation starts in proposed", () => {
  const item = newMacroAllocation("code-708", "name-532");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroAllocation moves to withdrawn", () => {
  const item = newMacroAllocation("code-708", "name-532");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("MacroAllocation rejects moves from withdrawn", () => {
  const item = newMacroAllocation("code-708", "name-532");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
