import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyMentionMilestone } from "./legacy-mention-milestone.js";

test("LegacyMentionMilestone starts in idle", () => {
  const item = newLegacyMentionMilestone("code-800", "label-16");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyMentionMilestone moves to warming", () => {
  const item = newLegacyMentionMilestone("code-800", "label-16");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LegacyMentionMilestone rejects moves from stopped", () => {
  const item = newLegacyMentionMilestone("code-800", "label-16");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
