import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveOptOutQuota } from "./adaptive-opt-out-quota.js";

test("AdaptiveOptOutQuota starts in proposed", () => {
  const item = newAdaptiveOptOutQuota("code-91", "label-964");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveOptOutQuota moves to approved", () => {
  const item = newAdaptiveOptOutQuota("code-91", "label-964");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("AdaptiveOptOutQuota rejects moves from withdrawn", () => {
  const item = newAdaptiveOptOutQuota("code-91", "label-964");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
