import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionQuota } from "./retention-quota.js";

test("RetentionQuota starts in planned", () => {
  const item = newRetentionQuota("code-698", "name-275");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionQuota moves to scheduled", () => {
  const item = newRetentionQuota("code-698", "name-275");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RetentionQuota rejects moves from cancelled", () => {
  const item = newRetentionQuota("code-698", "name-275");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
