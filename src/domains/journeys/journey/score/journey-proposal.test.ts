import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyProposal } from "./journey-proposal.js";

test("JourneyProposal starts in draft", () => {
  const item = newJourneyProposal("code-629", "label-688");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyProposal moves to suspended", () => {
  const item = newJourneyProposal("code-629", "label-688");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("JourneyProposal rejects moves from closed", () => {
  const item = newJourneyProposal("code-629", "label-688");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
