import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroSnapshot } from "./macro-snapshot.js";

test("MacroSnapshot starts in new", () => {
  const item = newMacroSnapshot("code-474", "title-37");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroSnapshot moves to queued", () => {
  const item = newMacroSnapshot("code-474", "title-37");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("MacroSnapshot rejects moves from failed", () => {
  const item = newMacroSnapshot("code-474", "title-37");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
