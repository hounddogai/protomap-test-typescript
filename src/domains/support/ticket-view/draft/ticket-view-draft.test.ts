import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewDraft } from "./ticket-view-draft.js";

test("TicketViewDraft starts in idle", () => {
  const item = newTicketViewDraft("code-637", "title-764");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewDraft moves to warming", () => {
  const item = newTicketViewDraft("code-637", "title-764");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("TicketViewDraft rejects moves from stopped", () => {
  const item = newTicketViewDraft("code-637", "title-764");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
