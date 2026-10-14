import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroPolicy } from "./macro-policy.js";

test("MacroPolicy starts in proposed", () => {
  const item = newMacroPolicy("code-342", "title-110");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroPolicy moves to approved", () => {
  const item = newMacroPolicy("code-342", "title-110");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("MacroPolicy rejects moves from withdrawn", () => {
  const item = newMacroPolicy("code-342", "title-110");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
