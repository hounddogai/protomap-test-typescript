import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalProofClaim } from "./seasonal-proof-claim.js";

test("SeasonalProofClaim starts in new", () => {
  const item = newSeasonalProofClaim("code-829", "title-819");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalProofClaim moves to queued", () => {
  const item = newSeasonalProofClaim("code-829", "title-819");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("SeasonalProofClaim rejects moves from failed", () => {
  const item = newSeasonalProofClaim("code-829", "title-819");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
