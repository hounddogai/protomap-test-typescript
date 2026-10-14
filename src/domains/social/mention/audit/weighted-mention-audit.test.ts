import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedMentionAudit } from "./weighted-mention-audit.js";

test("WeightedMentionAudit starts in proposed", () => {
  const item = newWeightedMentionAudit("code-232", "label-839");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedMentionAudit moves to approved", () => {
  const item = newWeightedMentionAudit("code-232", "label-839");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WeightedMentionAudit rejects moves from withdrawn", () => {
  const item = newWeightedMentionAudit("code-232", "label-839");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
