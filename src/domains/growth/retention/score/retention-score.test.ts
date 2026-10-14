import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionScore } from "./retention-score.js";

test("RetentionScore starts in proposed", () => {
  const item = newRetentionScore("code-297", "label-874");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionScore moves to approved", () => {
  const item = newRetentionScore("code-297", "label-874");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RetentionScore rejects moves from withdrawn", () => {
  const item = newRetentionScore("code-297", "label-874");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
