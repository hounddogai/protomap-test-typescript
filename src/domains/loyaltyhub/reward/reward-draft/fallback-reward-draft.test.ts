import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackRewardDraft } from "./fallback-reward-draft.js";

test("FallbackRewardDraft starts in planned", () => {
  const item = newFallbackRewardDraft("code-689", "name-760");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackRewardDraft moves to scheduled", () => {
  const item = newFallbackRewardDraft("code-689", "name-760");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("FallbackRewardDraft rejects moves from cancelled", () => {
  const item = newFallbackRewardDraft("code-689", "name-760");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
