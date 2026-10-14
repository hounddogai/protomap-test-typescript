import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictMentionPlan } from "./strict-mention-plan.js";

test("StrictMentionPlan starts in proposed", () => {
  const item = newStrictMentionPlan("code-951", "label-766");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictMentionPlan moves to withdrawn", () => {
  const item = newStrictMentionPlan("code-951", "label-766");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("StrictMentionPlan rejects moves from withdrawn", () => {
  const item = newStrictMentionPlan("code-951", "label-766");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
