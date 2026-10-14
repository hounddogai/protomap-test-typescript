import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroOverride } from "./macro-override.js";

test("MacroOverride starts in proposed", () => {
  const item = newMacroOverride("code-212", "label-715");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroOverride moves to approved", () => {
  const item = newMacroOverride("code-212", "label-715");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("MacroOverride rejects moves from withdrawn", () => {
  const item = newMacroOverride("code-212", "label-715");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
