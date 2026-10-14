import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualRewardRuleDraft } from "./manual-reward-rule-draft.js";

test("ManualRewardRuleDraft starts in created", () => {
  const item = newManualRewardRuleDraft("code-380", "label-174");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualRewardRuleDraft moves to published", () => {
  const item = newManualRewardRuleDraft("code-380", "label-174");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ManualRewardRuleDraft rejects moves from retired", () => {
  const item = newManualRewardRuleDraft("code-380", "label-174");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
