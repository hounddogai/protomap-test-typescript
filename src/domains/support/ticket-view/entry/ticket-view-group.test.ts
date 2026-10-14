import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewGroup } from "./ticket-view-group.js";

test("TicketViewGroup starts in draft", () => {
  const item = newTicketViewGroup("code-936", "label-478");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewGroup moves to pending", () => {
  const item = newTicketViewGroup("code-936", "label-478");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("TicketViewGroup rejects moves from closed", () => {
  const item = newTicketViewGroup("code-936", "label-478");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
