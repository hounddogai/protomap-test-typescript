import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionPlan } from "./mention-plan.js";

test("MentionPlan starts in proposed", () => {
  const item = newMentionPlan("code-541", "label-349");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionPlan moves to rejected", () => {
  const item = newMentionPlan("code-541", "label-349");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("MentionPlan rejects moves from withdrawn", () => {
  const item = newMentionPlan("code-541", "label-349");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
