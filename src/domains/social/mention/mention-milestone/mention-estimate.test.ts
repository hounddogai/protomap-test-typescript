import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionEstimate } from "./mention-estimate.js";

test("MentionEstimate starts in proposed", () => {
  const item = newMentionEstimate("code-437", "title-244");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionEstimate moves to rejected", () => {
  const item = newMentionEstimate("code-437", "title-244");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("MentionEstimate rejects moves from withdrawn", () => {
  const item = newMentionEstimate("code-437", "title-244");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
