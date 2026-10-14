import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationDraft } from "./activation-draft.js";

test("ActivationDraft starts in open", () => {
  const item = newActivationDraft("code-430", "name-316");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationDraft moves to in review", () => {
  const item = newActivationDraft("code-430", "name-316");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ActivationDraft rejects moves from archived", () => {
  const item = newActivationDraft("code-430", "name-316");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
