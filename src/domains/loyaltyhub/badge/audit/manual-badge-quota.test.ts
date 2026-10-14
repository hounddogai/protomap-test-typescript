import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualBadgeQuota } from "./manual-badge-quota.js";

test("ManualBadgeQuota starts in requested", () => {
  const item = newManualBadgeQuota("code-470", "title-224");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualBadgeQuota moves to revoked", () => {
  const item = newManualBadgeQuota("code-470", "title-224");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ManualBadgeQuota rejects moves from expired", () => {
  const item = newManualBadgeQuota("code-470", "title-224");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
