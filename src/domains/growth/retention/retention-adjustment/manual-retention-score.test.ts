import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualRetentionScore } from "./manual-retention-score.js";

test("ManualRetentionScore starts in open", () => {
  const item = newManualRetentionScore("code-819", "name-173");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualRetentionScore moves to resolved", () => {
  const item = newManualRetentionScore("code-819", "name-173");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ManualRetentionScore rejects moves from archived", () => {
  const item = newManualRetentionScore("code-819", "name-173");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
