import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionSummary } from "./retention-summary.js";

test("RetentionSummary starts in draft", () => {
  const item = newRetentionSummary("code-571", "name-423");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionSummary moves to pending", () => {
  const item = newRetentionSummary("code-571", "name-423");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("RetentionSummary rejects moves from closed", () => {
  const item = newRetentionSummary("code-571", "name-423");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
