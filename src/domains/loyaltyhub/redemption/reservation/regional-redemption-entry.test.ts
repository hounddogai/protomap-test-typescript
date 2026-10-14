import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalRedemptionEntry } from "./regional-redemption-entry.js";

test("RegionalRedemptionEntry starts in draft", () => {
  const item = newRegionalRedemptionEntry("code-126", "name-955");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalRedemptionEntry moves to pending", () => {
  const item = newRegionalRedemptionEntry("code-126", "name-955");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("RegionalRedemptionEntry rejects moves from closed", () => {
  const item = newRegionalRedemptionEntry("code-126", "name-955");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
