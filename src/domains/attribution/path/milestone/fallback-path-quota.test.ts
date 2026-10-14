import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackPathQuota } from "./fallback-path-quota.js";

test("FallbackPathQuota starts in planned", () => {
  const item = newFallbackPathQuota("code-605", "label-177");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackPathQuota moves to in progress", () => {
  const item = newFallbackPathQuota("code-605", "label-177");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("FallbackPathQuota rejects moves from cancelled", () => {
  const item = newFallbackPathQuota("code-605", "label-177");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
