import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingSenderClaim } from "./rolling-sender-claim.js";

test("RollingSenderClaim starts in new", () => {
  const item = newRollingSenderClaim("code-546", "title-924");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingSenderClaim moves to queued", () => {
  const item = newRollingSenderClaim("code-546", "title-924");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RollingSenderClaim rejects moves from failed", () => {
  const item = newRollingSenderClaim("code-546", "title-924");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
