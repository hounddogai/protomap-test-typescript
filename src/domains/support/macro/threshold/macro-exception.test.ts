import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroException } from "./macro-exception.js";

test("MacroException starts in draft", () => {
  const item = newMacroException("code-389", "name-791");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroException moves to active", () => {
  const item = newMacroException("code-389", "name-791");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("MacroException rejects moves from closed", () => {
  const item = newMacroException("code-389", "name-791");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
