import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedMacroEstimate } from "./capped-macro-estimate.js";

test("CappedMacroEstimate starts in open", () => {
  const item = newCappedMacroEstimate("code-861", "label-856");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedMacroEstimate moves to resolved", () => {
  const item = newCappedMacroEstimate("code-861", "label-856");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("CappedMacroEstimate rejects moves from archived", () => {
  const item = newCappedMacroEstimate("code-861", "label-856");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
