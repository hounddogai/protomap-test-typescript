import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultJourneyProposal } from "./default-journey-proposal.js";

test("DefaultJourneyProposal starts in open", () => {
  const item = newDefaultJourneyProposal("code-654", "label-21");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultJourneyProposal moves to reopened", () => {
  const item = newDefaultJourneyProposal("code-654", "label-21");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("DefaultJourneyProposal rejects moves from archived", () => {
  const item = newDefaultJourneyProposal("code-654", "label-21");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
