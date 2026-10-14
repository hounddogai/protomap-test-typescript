import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyRetentionQuota } from "./legacy-retention-quota.js";

test("LegacyRetentionQuota starts in planned", () => {
  const item = newLegacyRetentionQuota("code-804", "title-340");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyRetentionQuota moves to completed", () => {
  const item = newLegacyRetentionQuota("code-804", "title-340");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("LegacyRetentionQuota rejects moves from cancelled", () => {
  const item = newLegacyRetentionQuota("code-804", "title-340");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
