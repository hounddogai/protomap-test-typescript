import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroRecord } from "./macro-record.js";

test("MacroRecord starts in new", () => {
  const item = newMacroRecord("code-446", "label-82");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroRecord moves to done", () => {
  const item = newMacroRecord("code-446", "label-82");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("MacroRecord rejects moves from failed", () => {
  const item = newMacroRecord("code-446", "label-82");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
