import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewSegment } from "./ticket-view-segment.js";

test("TicketViewSegment starts in requested", () => {
  const item = newTicketViewSegment("code-326", "label-833");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewSegment moves to revoked", () => {
  const item = newTicketViewSegment("code-326", "label-833");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("TicketViewSegment rejects moves from expired", () => {
  const item = newTicketViewSegment("code-326", "label-833");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
