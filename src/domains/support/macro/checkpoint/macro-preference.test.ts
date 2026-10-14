import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroPreference } from "./macro-preference.js";

test("MacroPreference starts in requested", () => {
  const item = newMacroPreference("code-215", "label-177");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroPreference moves to expired", () => {
  const item = newMacroPreference("code-215", "label-177");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("MacroPreference rejects moves from expired", () => {
  const item = newMacroPreference("code-215", "label-177");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
