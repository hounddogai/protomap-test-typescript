import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionEntry } from "./redemption-entry.js";

test("RedemptionEntry starts in new", () => {
  const item = newRedemptionEntry("code-869", "title-667");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionEntry moves to running", () => {
  const item = newRedemptionEntry("code-869", "title-667");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("RedemptionEntry rejects moves from failed", () => {
  const item = newRedemptionEntry("code-869", "title-667");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
