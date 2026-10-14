import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveInviteSummary } from "./adaptive-invite-summary.js";

test("AdaptiveInviteSummary starts in planned", () => {
  const item = newAdaptiveInviteSummary("code-450", "title-271");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveInviteSummary moves to in progress", () => {
  const item = newAdaptiveInviteSummary("code-450", "title-271");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("AdaptiveInviteSummary rejects moves from cancelled", () => {
  const item = newAdaptiveInviteSummary("code-450", "title-271");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
