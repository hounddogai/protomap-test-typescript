import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroBaseline } from "./macro-baseline.js";

test("MacroBaseline starts in proposed", () => {
  const item = newMacroBaseline("code-628", "label-688");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroBaseline moves to withdrawn", () => {
  const item = newMacroBaseline("code-628", "label-688");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("MacroBaseline rejects moves from withdrawn", () => {
  const item = newMacroBaseline("code-628", "label-688");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
