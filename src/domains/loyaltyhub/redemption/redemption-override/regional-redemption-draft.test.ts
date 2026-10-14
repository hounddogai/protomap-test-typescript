import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalRedemptionDraft } from "./regional-redemption-draft.js";

test("RegionalRedemptionDraft starts in planned", () => {
  const item = newRegionalRedemptionDraft("code-550", "label-5");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalRedemptionDraft moves to completed", () => {
  const item = newRegionalRedemptionDraft("code-550", "label-5");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("RegionalRedemptionDraft rejects moves from cancelled", () => {
  const item = newRegionalRedemptionDraft("code-550", "label-5");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
