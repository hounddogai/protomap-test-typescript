import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingInsightSummary } from "./pending-insight-summary.js";

test("PendingInsightSummary starts in requested", () => {
  const item = newPendingInsightSummary("code-156", "name-313");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingInsightSummary moves to revoked", () => {
  const item = newPendingInsightSummary("code-156", "name-313");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("PendingInsightSummary rejects moves from expired", () => {
  const item = newPendingInsightSummary("code-156", "name-313");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
