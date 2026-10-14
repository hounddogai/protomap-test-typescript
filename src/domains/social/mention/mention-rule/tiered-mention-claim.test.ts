import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredMentionClaim } from "./tiered-mention-claim.js";

test("TieredMentionClaim starts in requested", () => {
  const item = newTieredMentionClaim("code-450", "name-358");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredMentionClaim moves to granted", () => {
  const item = newTieredMentionClaim("code-450", "name-358");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("TieredMentionClaim rejects moves from expired", () => {
  const item = newTieredMentionClaim("code-450", "name-358");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
