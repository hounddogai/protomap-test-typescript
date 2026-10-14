import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedTicketViewClaim } from "./batched-ticket-view-claim.js";

test("BatchedTicketViewClaim starts in requested", () => {
  const item = newBatchedTicketViewClaim("code-215", "title-323");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedTicketViewClaim moves to granted", () => {
  const item = newBatchedTicketViewClaim("code-215", "title-323");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("BatchedTicketViewClaim rejects moves from expired", () => {
  const item = newBatchedTicketViewClaim("code-215", "title-323");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
