import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionAudit } from "./redemption-audit.js";

test("RedemptionAudit starts in new", () => {
  const item = newRedemptionAudit("code-457", "name-405");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionAudit moves to queued", () => {
  const item = newRedemptionAudit("code-457", "name-405");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RedemptionAudit rejects moves from failed", () => {
  const item = newRedemptionAudit("code-457", "name-405");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
