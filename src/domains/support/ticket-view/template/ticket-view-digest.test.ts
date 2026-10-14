import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewDigest } from "./ticket-view-digest.js";

test("TicketViewDigest starts in draft", () => {
  const item = newTicketViewDigest("code-765", "label-390");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewDigest moves to active", () => {
  const item = newTicketViewDigest("code-765", "label-390");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("TicketViewDigest rejects moves from closed", () => {
  const item = newTicketViewDigest("code-765", "label-390");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
