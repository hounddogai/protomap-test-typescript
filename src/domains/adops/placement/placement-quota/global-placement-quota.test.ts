import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalPlacementQuota } from "./global-placement-quota.js";

test("GlobalPlacementQuota starts in proposed", () => {
  const item = newGlobalPlacementQuota("code-526", "name-170");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalPlacementQuota moves to approved", () => {
  const item = newGlobalPlacementQuota("code-526", "name-170");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("GlobalPlacementQuota rejects moves from withdrawn", () => {
  const item = newGlobalPlacementQuota("code-526", "name-170");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
