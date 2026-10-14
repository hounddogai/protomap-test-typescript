import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionTier } from "./retention-tier.js";

test("RetentionTier starts in new", () => {
  const item = newRetentionTier("code-423", "title-168");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionTier moves to done", () => {
  const item = newRetentionTier("code-423", "title-168");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("RetentionTier rejects moves from failed", () => {
  const item = newRetentionTier("code-423", "title-168");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
