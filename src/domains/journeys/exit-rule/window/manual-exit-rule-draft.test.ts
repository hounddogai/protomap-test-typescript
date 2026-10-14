import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualExitRuleDraft } from "./manual-exit-rule-draft.js";

test("ManualExitRuleDraft starts in created", () => {
  const item = newManualExitRuleDraft("code-664", "title-720");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualExitRuleDraft moves to validated", () => {
  const item = newManualExitRuleDraft("code-664", "title-720");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ManualExitRuleDraft rejects moves from retired", () => {
  const item = newManualExitRuleDraft("code-664", "title-720");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
