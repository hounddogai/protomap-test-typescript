import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackRetentionBundle } from "./fallback-retention-bundle.js";

test("FallbackRetentionBundle starts in planned", () => {
  const item = newFallbackRetentionBundle("code-916", "name-107");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackRetentionBundle moves to in progress", () => {
  const item = newFallbackRetentionBundle("code-916", "name-107");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("FallbackRetentionBundle rejects moves from cancelled", () => {
  const item = newFallbackRetentionBundle("code-916", "name-107");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
