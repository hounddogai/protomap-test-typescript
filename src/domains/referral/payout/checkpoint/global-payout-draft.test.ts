import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalPayoutDraft } from "./global-payout-draft.js";

test("GlobalPayoutDraft starts in created", () => {
  const item = newGlobalPayoutDraft("code-389", "title-900");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalPayoutDraft moves to retired", () => {
  const item = newGlobalPayoutDraft("code-389", "title-900");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("GlobalPayoutDraft rejects moves from retired", () => {
  const item = newGlobalPayoutDraft("code-389", "title-900");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
