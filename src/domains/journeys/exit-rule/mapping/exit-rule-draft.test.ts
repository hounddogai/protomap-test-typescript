import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleDraft } from "./exit-rule-draft.js";

test("ExitRuleDraft starts in created", () => {
  const item = newExitRuleDraft("code-3", "title-118");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleDraft moves to published", () => {
  const item = newExitRuleDraft("code-3", "title-118");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ExitRuleDraft rejects moves from retired", () => {
  const item = newExitRuleDraft("code-3", "title-118");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
