import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelQuota } from "./funnel-quota.js";

test("FunnelQuota starts in open", () => {
  const item = newFunnelQuota("code-965", "label-582");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelQuota moves to resolved", () => {
  const item = newFunnelQuota("code-965", "label-582");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("FunnelQuota rejects moves from archived", () => {
  const item = newFunnelQuota("code-965", "label-582");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
