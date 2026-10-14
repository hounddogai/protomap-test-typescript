import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredMacroAgreement } from "./tiered-macro-agreement.js";

test("TieredMacroAgreement starts in planned", () => {
  const item = newTieredMacroAgreement("code-614", "title-344");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredMacroAgreement moves to cancelled", () => {
  const item = newTieredMacroAgreement("code-614", "title-344");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("TieredMacroAgreement rejects moves from cancelled", () => {
  const item = newTieredMacroAgreement("code-614", "title-344");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
