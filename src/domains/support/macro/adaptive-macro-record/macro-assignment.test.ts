import assert from "node:assert/strict";
import { test } from "node:test";
import { newMacroAssignment } from "./macro-assignment.js";

test("MacroAssignment starts in open", () => {
  const item = newMacroAssignment("code-127", "label-607");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MacroAssignment moves to reopened", () => {
  const item = newMacroAssignment("code-127", "label-607");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("MacroAssignment rejects moves from archived", () => {
  const item = newMacroAssignment("code-127", "label-607");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
