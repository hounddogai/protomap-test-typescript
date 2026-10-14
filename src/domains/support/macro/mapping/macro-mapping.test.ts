import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroMapping } from "./macro-mapping.js";

test("MacroMapping starts in open", () => {
  const item = newMacroMapping("code-215", "name-76");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroMapping moves to resolved", () => {
  const item = newMacroMapping("code-215", "name-76");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("MacroMapping rejects moves from archived", () => {
  const item = newMacroMapping("code-215", "name-76");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
