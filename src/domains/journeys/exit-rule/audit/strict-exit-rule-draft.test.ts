import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictExitRuleDraft } from "./strict-exit-rule-draft.js";

test("StrictExitRuleDraft starts in requested", () => {
  const item = newStrictExitRuleDraft("code-743", "title-558");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictExitRuleDraft moves to expired", () => {
  const item = newStrictExitRuleDraft("code-743", "title-558");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("StrictExitRuleDraft rejects moves from expired", () => {
  const item = newStrictExitRuleDraft("code-743", "title-558");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
