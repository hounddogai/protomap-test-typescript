import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalReputationClaim } from "./regional-reputation-claim.js";

test("RegionalReputationClaim starts in new", () => {
  const item = newRegionalReputationClaim("code-358", "name-547");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalReputationClaim moves to failed", () => {
  const item = newRegionalReputationClaim("code-358", "name-547");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("RegionalReputationClaim rejects moves from failed", () => {
  const item = newRegionalReputationClaim("code-358", "name-547");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
