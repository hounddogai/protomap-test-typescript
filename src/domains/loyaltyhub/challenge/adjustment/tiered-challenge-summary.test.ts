import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredChallengeSummary } from "./tiered-challenge-summary.js";

test("TieredChallengeSummary starts in proposed", () => {
  const item = newTieredChallengeSummary("code-762", "label-577");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredChallengeSummary moves to rejected", () => {
  const item = newTieredChallengeSummary("code-762", "label-577");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("TieredChallengeSummary rejects moves from withdrawn", () => {
  const item = newTieredChallengeSummary("code-762", "label-577");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
