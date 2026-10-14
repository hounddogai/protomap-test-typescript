import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortProposal } from "./cohort-proposal.js";

test("CohortProposal starts in proposed", () => {
  const item = newCohortProposal("code-168", "title-711");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortProposal moves to approved", () => {
  const item = newCohortProposal("code-168", "title-711");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("CohortProposal rejects moves from withdrawn", () => {
  const item = newCohortProposal("code-168", "title-711");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
