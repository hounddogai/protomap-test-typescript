import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingTierThreshold } from "./pending-tier-threshold.js";

test("PendingTierThreshold starts in open", () => {
  const item = newPendingTierThreshold("code-749", "title-385");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingTierThreshold moves to in review", () => {
  const item = newPendingTierThreshold("code-749", "title-385");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PendingTierThreshold rejects moves from archived", () => {
  const item = newPendingTierThreshold("code-749", "title-385");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
