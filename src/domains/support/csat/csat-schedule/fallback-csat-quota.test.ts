import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackCsatQuota } from "./fallback-csat-quota.js";

test("FallbackCsatQuota starts in planned", () => {
  const item = newFallbackCsatQuota("code-595", "title-165");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackCsatQuota moves to completed", () => {
  const item = newFallbackCsatQuota("code-595", "title-165");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("FallbackCsatQuota rejects moves from cancelled", () => {
  const item = newFallbackCsatQuota("code-595", "title-165");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
