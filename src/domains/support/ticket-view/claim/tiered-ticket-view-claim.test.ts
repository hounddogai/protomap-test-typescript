import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredTicketViewClaim } from "./tiered-ticket-view-claim.js";

test("TieredTicketViewClaim starts in new", () => {
  const item = newTieredTicketViewClaim("code-256", "title-653");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredTicketViewClaim moves to queued", () => {
  const item = newTieredTicketViewClaim("code-256", "title-653");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("TieredTicketViewClaim rejects moves from failed", () => {
  const item = newTieredTicketViewClaim("code-256", "title-653");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
