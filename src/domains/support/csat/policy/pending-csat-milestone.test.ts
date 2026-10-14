import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingCsatMilestone } from "./pending-csat-milestone.js";

test("PendingCsatMilestone starts in requested", () => {
  const item = newPendingCsatMilestone("code-40", "title-924");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingCsatMilestone moves to revoked", () => {
  const item = newPendingCsatMilestone("code-40", "title-924");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("PendingCsatMilestone rejects moves from expired", () => {
  const item = newPendingCsatMilestone("code-40", "title-924");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
