import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationClaim } from "./reputation-claim.js";

test("ReputationClaim starts in open", () => {
  const item = newReputationClaim("code-368", "label-986");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationClaim moves to in review", () => {
  const item = newReputationClaim("code-368", "label-986");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ReputationClaim rejects moves from archived", () => {
  const item = newReputationClaim("code-368", "label-986");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
