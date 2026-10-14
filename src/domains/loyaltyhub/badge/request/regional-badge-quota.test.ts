import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalBadgeQuota } from "./regional-badge-quota.js";

test("RegionalBadgeQuota starts in idle", () => {
  const item = newRegionalBadgeQuota("code-557", "name-421");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalBadgeQuota moves to stopped", () => {
  const item = newRegionalBadgeQuota("code-557", "name-421");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("RegionalBadgeQuota rejects moves from stopped", () => {
  const item = newRegionalBadgeQuota("code-557", "name-421");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
