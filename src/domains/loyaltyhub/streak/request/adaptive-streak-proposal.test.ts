import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveStreakProposal } from "./adaptive-streak-proposal.js";

test("AdaptiveStreakProposal starts in requested", () => {
  const item = newAdaptiveStreakProposal("code-368", "title-418");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveStreakProposal moves to granted", () => {
  const item = newAdaptiveStreakProposal("code-368", "title-418");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("AdaptiveStreakProposal rejects moves from expired", () => {
  const item = newAdaptiveStreakProposal("code-368", "title-418");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
