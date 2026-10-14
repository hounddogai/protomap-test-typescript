import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryReputationClaim } from "./primary-reputation-claim.js";

test("PrimaryReputationClaim starts in proposed", () => {
  const item = newPrimaryReputationClaim("code-528", "title-257");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryReputationClaim moves to rejected", () => {
  const item = newPrimaryReputationClaim("code-528", "title-257");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PrimaryReputationClaim rejects moves from withdrawn", () => {
  const item = newPrimaryReputationClaim("code-528", "title-257");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
