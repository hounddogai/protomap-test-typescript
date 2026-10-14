import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictRetentionQuota } from "./strict-retention-quota.js";

test("StrictRetentionQuota starts in new", () => {
  const item = newStrictRetentionQuota("code-248", "title-757");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictRetentionQuota moves to done", () => {
  const item = newStrictRetentionQuota("code-248", "title-757");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("StrictRetentionQuota rejects moves from failed", () => {
  const item = newStrictRetentionQuota("code-248", "title-757");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
