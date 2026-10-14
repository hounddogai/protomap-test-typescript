import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroTemplate } from "./macro-template.js";

test("MacroTemplate starts in open", () => {
  const item = newMacroTemplate("code-592", "label-154");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroTemplate moves to resolved", () => {
  const item = newMacroTemplate("code-592", "label-154");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("MacroTemplate rejects moves from archived", () => {
  const item = newMacroTemplate("code-592", "label-154");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
