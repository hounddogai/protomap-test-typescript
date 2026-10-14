import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierAudit } from "./tier-audit.js";

test("TierAudit starts in requested", () => {
  const item = newTierAudit("code-808", "title-135");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierAudit moves to revoked", () => {
  const item = newTierAudit("code-808", "title-135");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("TierAudit rejects moves from expired", () => {
  const item = newTierAudit("code-808", "title-135");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
