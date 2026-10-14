import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingProofAudit } from "./pending-proof-audit.js";

test("PendingProofAudit starts in draft", () => {
  const item = newPendingProofAudit("code-446", "title-162");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingProofAudit moves to active", () => {
  const item = newPendingProofAudit("code-446", "title-162");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PendingProofAudit rejects moves from closed", () => {
  const item = newPendingProofAudit("code-446", "title-162");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
