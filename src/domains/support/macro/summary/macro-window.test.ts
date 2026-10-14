import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroWindow } from "./macro-window.js";

test("MacroWindow starts in created", () => {
  const item = newMacroWindow("code-925", "label-496");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroWindow moves to published", () => {
  const item = newMacroWindow("code-925", "label-496");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("MacroWindow rejects moves from retired", () => {
  const item = newMacroWindow("code-925", "label-496");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
