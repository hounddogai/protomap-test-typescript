import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacySenderMilestone } from "./legacy-sender-milestone.js";

test("LegacySenderMilestone starts in draft", () => {
  const item = newLegacySenderMilestone("code-416", "label-703");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacySenderMilestone moves to suspended", () => {
  const item = newLegacySenderMilestone("code-416", "label-703");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("LegacySenderMilestone rejects moves from closed", () => {
  const item = newLegacySenderMilestone("code-416", "label-703");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
