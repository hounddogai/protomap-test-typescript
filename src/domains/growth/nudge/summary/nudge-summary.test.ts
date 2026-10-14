import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeSummary } from "./nudge-summary.js";

test("NudgeSummary starts in draft", () => {
  const item = newNudgeSummary("code-448", "name-672");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeSummary moves to closed", () => {
  const item = newNudgeSummary("code-448", "name-672");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("NudgeSummary rejects moves from closed", () => {
  const item = newNudgeSummary("code-448", "name-672");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
