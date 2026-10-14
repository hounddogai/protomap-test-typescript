import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalOptOutQuota } from "./regional-opt-out-quota.js";

test("RegionalOptOutQuota starts in draft", () => {
  const item = newRegionalOptOutQuota("code-362", "title-605");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalOptOutQuota moves to pending", () => {
  const item = newRegionalOptOutQuota("code-362", "title-605");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("RegionalOptOutQuota rejects moves from closed", () => {
  const item = newRegionalOptOutQuota("code-362", "title-605");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
