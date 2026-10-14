import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackBounceQuota } from "./fallback-bounce-quota.js";

test("FallbackBounceQuota starts in open", () => {
  const item = newFallbackBounceQuota("code-702", "title-310");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackBounceQuota moves to resolved", () => {
  const item = newFallbackBounceQuota("code-702", "title-310");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("FallbackBounceQuota rejects moves from archived", () => {
  const item = newFallbackBounceQuota("code-702", "title-310");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
