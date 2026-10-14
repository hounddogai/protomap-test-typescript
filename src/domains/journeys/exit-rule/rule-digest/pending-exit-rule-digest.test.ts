import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingExitRuleDigest } from "./pending-exit-rule-digest.js";

test("PendingExitRuleDigest starts in planned", () => {
  const item = newPendingExitRuleDigest("code-925", "title-531");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingExitRuleDigest moves to in progress", () => {
  const item = newPendingExitRuleDigest("code-925", "title-531");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("PendingExitRuleDigest rejects moves from cancelled", () => {
  const item = newPendingExitRuleDigest("code-925", "title-531");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
