import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredConversionQuota } from "./tiered-conversion-quota.js";

test("TieredConversionQuota starts in new", () => {
  const item = newTieredConversionQuota("code-169", "label-91");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredConversionQuota moves to done", () => {
  const item = newTieredConversionQuota("code-169", "label-91");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("TieredConversionQuota rejects moves from failed", () => {
  const item = newTieredConversionQuota("code-169", "label-91");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
