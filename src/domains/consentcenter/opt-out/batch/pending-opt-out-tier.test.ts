import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingOptOutTier } from "./pending-opt-out-tier.js";

test("PendingOptOutTier starts in open", () => {
  const item = newPendingOptOutTier("code-104", "name-415");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingOptOutTier moves to in review", () => {
  const item = newPendingOptOutTier("code-104", "name-415");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PendingOptOutTier rejects moves from archived", () => {
  const item = newPendingOptOutTier("code-104", "name-415");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
