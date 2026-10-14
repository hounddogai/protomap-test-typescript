import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionDraft } from "./redemption-draft.js";

test("RedemptionDraft starts in idle", () => {
  const item = newRedemptionDraft("code-711", "name-93");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionDraft moves to draining", () => {
  const item = newRedemptionDraft("code-711", "name-93");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("RedemptionDraft rejects moves from stopped", () => {
  const item = newRedemptionDraft("code-711", "name-93");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
