import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveExitRuleDraft } from "./adaptive-exit-rule-draft.js";

test("AdaptiveExitRuleDraft starts in created", () => {
  const item = newAdaptiveExitRuleDraft("code-75", "name-537");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveExitRuleDraft moves to retired", () => {
  const item = newAdaptiveExitRuleDraft("code-75", "name-537");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("AdaptiveExitRuleDraft rejects moves from retired", () => {
  const item = newAdaptiveExitRuleDraft("code-75", "name-537");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
