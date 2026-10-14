import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroTarget } from "./macro-target.js";

test("MacroTarget starts in planned", () => {
  const item = newMacroTarget("code-667", "name-931");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroTarget moves to scheduled", () => {
  const item = newMacroTarget("code-667", "name-931");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("MacroTarget rejects moves from cancelled", () => {
  const item = newMacroTarget("code-667", "name-931");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
