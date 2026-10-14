import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalRewardSummary } from "./global-reward-summary.js";

test("GlobalRewardSummary starts in draft", () => {
  const item = newGlobalRewardSummary("code-335", "title-407");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalRewardSummary moves to pending", () => {
  const item = newGlobalRewardSummary("code-335", "title-407");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("GlobalRewardSummary rejects moves from closed", () => {
  const item = newGlobalRewardSummary("code-335", "title-407");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
