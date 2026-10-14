import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroEntry } from "./macro-entry.js";

test("MacroEntry starts in proposed", () => {
  const item = newMacroEntry("code-646", "name-900");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroEntry moves to rejected", () => {
  const item = newMacroEntry("code-646", "name-900");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("MacroEntry rejects moves from withdrawn", () => {
  const item = newMacroEntry("code-646", "name-900");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
