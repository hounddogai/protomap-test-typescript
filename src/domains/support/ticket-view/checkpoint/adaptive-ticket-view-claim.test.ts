import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveTicketViewClaim } from "./adaptive-ticket-view-claim.js";

test("AdaptiveTicketViewClaim starts in created", () => {
  const item = newAdaptiveTicketViewClaim("code-596", "label-607");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveTicketViewClaim moves to published", () => {
  const item = newAdaptiveTicketViewClaim("code-596", "label-607");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("AdaptiveTicketViewClaim rejects moves from retired", () => {
  const item = newAdaptiveTicketViewClaim("code-596", "label-607");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
