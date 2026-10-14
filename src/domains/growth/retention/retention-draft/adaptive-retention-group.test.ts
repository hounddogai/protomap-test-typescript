import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveRetentionGroup } from "./adaptive-retention-group.js";

test("AdaptiveRetentionGroup starts in draft", () => {
  const item = newAdaptiveRetentionGroup("code-714", "title-154");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveRetentionGroup moves to pending", () => {
  const item = newAdaptiveRetentionGroup("code-714", "title-154");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("AdaptiveRetentionGroup rejects moves from closed", () => {
  const item = newAdaptiveRetentionGroup("code-714", "title-154");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
