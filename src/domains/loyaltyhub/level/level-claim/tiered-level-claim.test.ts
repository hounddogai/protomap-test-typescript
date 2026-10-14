import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredLevelClaim } from "./tiered-level-claim.js";

test("TieredLevelClaim starts in requested", () => {
  const item = newTieredLevelClaim("code-42", "title-30");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredLevelClaim moves to granted", () => {
  const item = newTieredLevelClaim("code-42", "title-30");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("TieredLevelClaim rejects moves from expired", () => {
  const item = newTieredLevelClaim("code-42", "title-30");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
