import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveBadgeQuota } from "./adaptive-badge-quota.js";

test("AdaptiveBadgeQuota starts in proposed", () => {
  const item = newAdaptiveBadgeQuota("code-260", "label-662");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveBadgeQuota moves to rejected", () => {
  const item = newAdaptiveBadgeQuota("code-260", "label-662");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("AdaptiveBadgeQuota rejects moves from withdrawn", () => {
  const item = newAdaptiveBadgeQuota("code-260", "label-662");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
