import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyTicketViewDraft } from "./legacy-ticket-view-draft.js";

test("LegacyTicketViewDraft starts in draft", () => {
  const item = newLegacyTicketViewDraft("code-452", "title-487");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyTicketViewDraft moves to pending", () => {
  const item = newLegacyTicketViewDraft("code-452", "title-487");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("LegacyTicketViewDraft rejects moves from closed", () => {
  const item = newLegacyTicketViewDraft("code-452", "title-487");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
