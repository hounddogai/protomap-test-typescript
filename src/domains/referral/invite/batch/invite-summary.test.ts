import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteSummary } from "./invite-summary.js";

test("InviteSummary starts in created", () => {
  const item = newInviteSummary("code-621", "label-787");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteSummary moves to published", () => {
  const item = newInviteSummary("code-621", "label-787");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("InviteSummary rejects moves from retired", () => {
  const item = newInviteSummary("code-621", "label-787");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
