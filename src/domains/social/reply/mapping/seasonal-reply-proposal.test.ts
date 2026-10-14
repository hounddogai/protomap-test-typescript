import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalReplyProposal } from "./seasonal-reply-proposal.js";

test("SeasonalReplyProposal starts in planned", () => {
  const item = newSeasonalReplyProposal("code-264", "label-749");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalReplyProposal moves to completed", () => {
  const item = newSeasonalReplyProposal("code-264", "label-749");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("SeasonalReplyProposal rejects moves from cancelled", () => {
  const item = newSeasonalReplyProposal("code-264", "label-749");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
