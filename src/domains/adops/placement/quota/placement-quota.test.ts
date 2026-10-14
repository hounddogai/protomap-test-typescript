import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementQuota } from "./placement-quota.js";

test("PlacementQuota starts in new", () => {
  const item = newPlacementQuota("code-640", "name-960");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementQuota moves to queued", () => {
  const item = newPlacementQuota("code-640", "name-960");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PlacementQuota rejects moves from failed", () => {
  const item = newPlacementQuota("code-640", "name-960");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
