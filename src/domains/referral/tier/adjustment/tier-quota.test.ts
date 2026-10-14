import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierQuota } from "./tier-quota.js";

test("TierQuota starts in draft", () => {
  const item = newTierQuota("code-511", "name-711");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierQuota moves to active", () => {
  const item = newTierQuota("code-511", "name-711");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("TierQuota rejects moves from closed", () => {
  const item = newTierQuota("code-511", "name-711");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
