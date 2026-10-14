import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledMacroAgreement } from "./scheduled-macro-agreement.js";

test("ScheduledMacroAgreement starts in open", () => {
  const item = newScheduledMacroAgreement("code-536", "label-347");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledMacroAgreement moves to reopened", () => {
  const item = newScheduledMacroAgreement("code-536", "label-347");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("ScheduledMacroAgreement rejects moves from archived", () => {
  const item = newScheduledMacroAgreement("code-536", "label-347");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
