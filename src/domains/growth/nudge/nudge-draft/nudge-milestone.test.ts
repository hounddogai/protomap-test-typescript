import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeMilestone } from "./nudge-milestone.js";

test("NudgeMilestone starts in requested", () => {
  const item = newNudgeMilestone("code-627", "label-603");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeMilestone moves to expired", () => {
  const item = newNudgeMilestone("code-627", "label-603");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("NudgeMilestone rejects moves from expired", () => {
  const item = newNudgeMilestone("code-627", "label-603");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
