import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyProofClaim } from "./legacy-proof-claim.js";

test("LegacyProofClaim starts in open", () => {
  const item = newLegacyProofClaim("code-76", "name-188");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyProofClaim moves to in review", () => {
  const item = newLegacyProofClaim("code-76", "name-188");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("LegacyProofClaim rejects moves from archived", () => {
  const item = newLegacyProofClaim("code-76", "name-188");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
