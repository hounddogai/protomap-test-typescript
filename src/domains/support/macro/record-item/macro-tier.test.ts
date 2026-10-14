import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroTier } from "./macro-tier.js";

test("MacroTier starts in created", () => {
  const item = newMacroTier("code-187", "title-351");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroTier moves to validated", () => {
  const item = newMacroTier("code-187", "title-351");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("MacroTier rejects moves from retired", () => {
  const item = newMacroTier("code-187", "title-351");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
