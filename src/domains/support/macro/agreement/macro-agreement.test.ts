import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroAgreement } from "./macro-agreement.js";

test("MacroAgreement starts in planned", () => {
  const item = newMacroAgreement("code-440", "title-844");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroAgreement moves to in progress", () => {
  const item = newMacroAgreement("code-440", "title-844");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("MacroAgreement rejects moves from cancelled", () => {
  const item = newMacroAgreement("code-440", "title-844");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
