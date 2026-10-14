import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroThreshold } from "./macro-threshold.js";

test("MacroThreshold starts in requested", () => {
  const item = newMacroThreshold("code-38", "title-445");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroThreshold moves to expired", () => {
  const item = newMacroThreshold("code-38", "title-445");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("MacroThreshold rejects moves from expired", () => {
  const item = newMacroThreshold("code-38", "title-445");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
