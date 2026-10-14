import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalFraudCheckClaim } from "./seasonal-fraud-check-claim.js";

test("SeasonalFraudCheckClaim starts in draft", () => {
  const item = newSeasonalFraudCheckClaim("code-832", "title-782");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalFraudCheckClaim moves to pending", () => {
  const item = newSeasonalFraudCheckClaim("code-832", "title-782");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SeasonalFraudCheckClaim rejects moves from closed", () => {
  const item = newSeasonalFraudCheckClaim("code-832", "title-782");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
